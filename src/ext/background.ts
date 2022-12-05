import 'regenerator-runtime';
import {listen, Message, runInPromises, send, Subscription} from "./utils";
import {BensrsClient} from "../services/bensrs";
import {runPromise} from "../cancellable";
import {syncFiles} from "../services/sync";
import {Dropbox, DropboxAuth} from "dropbox";
import {DropboxSyncBackend} from "../services/dropbox";
import {FileStore, normalizeBlob, readText} from "../services/storage";
import {Dexie} from "dexie";
import {denormalizedNote, getLanguagesOfNotes, indexesInitialState, parseNote, updateNotes} from "../notes";
import {Indexer} from "../utils/indexable";

let syncSub = new Subscription();
const filestore = new FileStore(new Dexie("bensrs"))
let indexesState = {...indexesInitialState};
let lastAccessToken = "";

listen(async (msg: Message, sender, sendResponse) => {
    console.log("got message", msg)
    try {
        switch (msg.type) {
            case "start-sync":
                restartSync(sendResponse);
                return;
            case "request-languages":
                sendResponse(getLanguagesOfNotes(indexesState.notes))
                return;
            case "request-terms":
                const iterator = Indexer.iterator(indexesState.taggedClozes.byTagSpokenAndNextDue,
                    [localStorage.getItem("language"), false, false, 0],
                            [localStorage.getItem("language"), false, false, Date.now() / 1000 / 60])
                const terms: string[] = [];
                for (let next = iterator(); next; next = iterator()) {
                    const r = next[0].inner.reference;
                    terms.push(r);
                }
                sendResponse(terms);
                return;
            case "start-highlight":
                const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
                await browser.scripting.executeScript({
                    files: ['content.js'],
                    target: {
                        tabId: tab.id,
                    }
                });
                sendResponse({});
                break;
            default:
                break;
        }
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        console.log("completed handling event");
    }
})

function restartSync(sendResponse: Function) {
    syncSub.close();
    syncSub = new Subscription();

    syncSub.add(runInPromises(function* () {
        try {
            let host: string;
            try {
                host = JSON.parse(localStorage.getItem("host") || "");
            } catch {
                console.log("Sync stopped, no host configured.");
                return;
            }

            const hasHostPerm = yield browser.permissions.contains({origins: [host + "/"]});
            if (!hasHostPerm) {
                yield browser.permissions.request({origins: [host + "/"]})
            }
            const client = new BensrsClient(host);
            const results = yield* runPromise(client.callJson(BensrsClient.LoginEndpoint, {}));
            if (!results.success) return;

            if (results.access_token != lastAccessToken) {
                lastAccessToken = results.access_token || "";
                indexesState = {...indexesInitialState};
                console.log('reading blobs');
                const noteBlobs = yield* runPromise(filestore.fetchBlobsByExt('txt'));
                for (let {blob, id, rev, path} of noteBlobs) {
                    const contents = yield readText(normalizeBlob(blob));
                    const normalized = parseNote(contents);
                    const denormalized = denormalizedNote(normalized, id, path, rev);
                    updateNotes(indexesState, denormalized);
                }
                console.log('done loading blobs');
            }

            const auth = new DropboxAuth({
                accessToken: results.access_token,
                clientId: results.app_key,
            });
            const dropbox = new Dropbox({ auth });
            yield* syncFiles(
                new DropboxSyncBackend(dropbox),
                filestore,
                () => null,
                indexesState,
            )

            sendResponse(true);
        } finally {
            sendResponse(false)
        }
    }));
}