import 'regenerator-runtime';
import {listen, Message, runInPromises, Subscription} from "./utils";
import {runPromise} from "../cancellable";
import {syncFiles} from "../services/sync";
import {Dropbox, DropboxAuth} from "dropbox";
import {DropboxSyncBackend} from "../services/dropbox";
import {FileStore, normalizeBlob, readText} from "../services/storage";
import {Dexie} from "dexie";
import {denormalizedNote, getLanguagesOfNotes, indexesInitialState, parseNote, updateNotes} from "../notes";
import {Indexer} from "../utils/indexable";

let syncSub = new Subscription();
let loadSub = new Subscription();
const filestore = new FileStore(new Dexie("bensrs"))
const indexesState = {...indexesInitialState};
let lastAccessToken = "";
let curLanguage = "";

listen((msg: Message, sender, sendResponse) => {
    console.log("got message", msg)
    try {
        switch (msg.type) {
            case "start-sync":
                restartSync(sendResponse, msg.auth, msg.app_key);
                return true;
            case "request-languages":
                sendResponse(getLanguagesOfNotes(indexesState.notes))
                return false;
            case "load-blobs":
                console.log('received, true now')
                restartLoad(sendResponse);
                return true;
            case "request-terms":
                const iterator = Indexer.iterator(indexesState.taggedClozes.byTagSpokenAndNextDue,
                    [curLanguage, false, false, 0],
                            [curLanguage, false, false, Date.now() / 1000 / 60])
                const terms: string[] = [];
                for (let next = iterator(); next; next = iterator()) {
                    const r = next[0].inner.reference;
                    if (!next[0].inner.attributes.schedule.delayIntervalMinutes) terms.push(r);
                }
                sendResponse(terms);
                return false;
            case "start-highlight":
                curLanguage = msg.language;
                (async () => {
                    const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
                    await browser.scripting.executeScript({
                        files: ['content.js'],
                        target: {
                            tabId: tab.id,
                        }
                    });
                    sendResponse({});
                })();
                return true;
            default:
                break;
        }
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        console.log("completed handling event");
    }

    return false;
})

function restartLoad(sendResponse: Function) {
    loadSub.close();
    loadSub = new Subscription();

    loadSub.add(runInPromises(function* () {
        try {
            Object.assign(indexesState, {...indexesInitialState});
            const noteBlobs = yield* runPromise(filestore.fetchBlobsByExt('txt'));
            for (let {blob, id, rev, path} of noteBlobs) {
                const contents = yield readText(normalizeBlob(blob));
                const normalized = parseNote(contents);
                const denormalized = denormalizedNote(normalized, id, path, rev);
                updateNotes(indexesState, denormalized);
            }
            console.log('done loading blobs')
        } finally {
            sendResponse(true);
        }
    }));
}

function restartSync(sendResponse: Function, accessToken: string, clientId: string) {
    syncSub.close();
    syncSub = new Subscription();

    syncSub.add(runInPromises(function* () {
        try {
            lastAccessToken = accessToken;

            const auth = new DropboxAuth({
                accessToken,
                clientId,
            });
            const dropbox = new Dropbox({ auth, fetch: function() {
                    return fetch.apply(self, arguments as any);
                }});
            console.log('syncing files')
            yield* syncFiles(
                new DropboxSyncBackend(dropbox),
                filestore,
                () => null,
                indexesState,
                true
            )
            console.log('finished syncing files')

            sendResponse(true);
        } finally {
            sendResponse(false)
        }
    }));
}