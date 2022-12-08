import 'regenerator-runtime';
import {ListenController, restartable, SendController, Subscription} from "./utils";
import {syncFiles} from "../services/sync";
import {Dropbox, DropboxAuth} from "dropbox";
import {DropboxSyncBackend} from "../services/dropbox";
import {Dexie} from "dexie";
import {stringifyNote, Term} from "../notes";
import {Indexer} from "../utils/indexable";
import {mapSome, mapSomeAsync} from "../utils/maybe";
import {Answer} from "../scheduler";
import {answerStudy} from "../study";
import {BensrsClient} from "../services/bensrs";
import {ExFileStore} from "./exFileStore";
import {defaultState, SessionState} from "./state";

const filestore = new ExFileStore(new Dexie("bensrs"))

const restartSync = restartable(function* (accessToken: string, clientId: string) {
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
        null,
        true
    )
    console.log('finished syncing files')
})

export class BackgroundServer extends ListenController<"bg"> {
    scanSub = new Subscription();

    constructor() {
        super("bg");
    }

    async _getState(): Promise<SessionState> {
        const {state} = await browser.storage.local.get("state");
        return {...defaultState, ...state};
    }

    async _updateState(f: (cur: SessionState) => SessionState): Promise<SessionState> {
        let {state} = await browser.storage.local.get("state");
        state = f({...defaultState, ...state});
        await browser.storage.local.set({ state });
        return state;
    }

    async finishScanning()  {
        this.scanSub.close();
    }

    async clear() {
        const {curTabId, curTerm} = await this._getState();
        console.log({curTerm, curTabId})
        await browser.scripting.executeScript({
          target: {tabId: curTabId},
          func: (term: string) => {
              console.log('clearing', term);
              const elements = document.getElementsByClassName(`term-${term.replace(/ /g, "-")}`);
              for (let i = 0; i < elements.length; ++i) {
                  console.log('replacing...');
                  elements[i].replaceWith(document.createTextNode(term));
              }
          },
          args: [curTerm],
        });
        await this._updateState(cur => ({...cur, curTerm: "", curTerms: [], selectBuffer: ""}));
    }

    async answerTerm(term: Term, answer: Answer) {
        const indexesState = await filestore.getNotesIndex(term.noteId);
        const cloze = Indexer.getFirstMatching(indexesState.clozes.byNoteIdReferenceMarkerAndClozeIdx, [term.noteId, term.attributes.reference, term.attributes.marker])
        await mapSomeAsync(cloze, async cloze => {
            await mapSomeAsync(answerStudy(cloze, answer, indexesState), async ([tree, updated]) => {
                const blob = new Blob([stringifyNote(updated)]);
                await filestore.storeBlob(blob, {
                    path: tree.note.path,
                    id: tree.note.id,
                    rev: tree.note.version,
                    size: blob.size,
                }, true);

                await this.startSync();
            });
        })
    }

    async selectTerm(curTerm: string) {
        browser.action.openPopup();
        const curTerms = await filestore.getReferencedTerms(curTerm);
        await this._updateState(cur => ({...cur, curTerms, curTerm}))
    }

    async startSync(accessToken = "", clientId = "") {
        if (!accessToken || !clientId) {
            console.log('retrieving token')
            const {host} = await browser.storage.local.get("host");
            const client = new BensrsClient(host)
            const result = await client.callJson(
                BensrsClient.LoginEndpoint,
                {}
            );
            if (!result.success) return;
            console.log('token acquired');
            accessToken = result.access_token || "";
            clientId = result.app_key || "";
        }

        try {
            console.log('starting sync....');
            await restartSync(accessToken, clientId).promise;
            console.log('sync complete');
        } finally {
            const languages = await filestore.getLanguages();
            await this._updateState(cur => ({...cur, languages }));
        }
    }

    async getTerms() {
        const terms: string[] = [];
        const v: Record<string, boolean> = {};
        const dedup = (r: string) => {
            if (v[r]) return true;
            v[r] = true;
            return false
        }

        const {curLanguage} = await this._getState();
        const scheduledClozes = await filestore.searchSchedule(curLanguage, false, false, 0, Date.now() / 1000 / 60, false);
        const indexesState = await filestore.getTermsIndex(scheduledClozes.map(({noteId}) => noteId));

        for (let cloze of scheduledClozes) {
            if (cloze.attributes.type != "recognize") continue;
            const r = cloze.reference;
            if (dedup(`${cloze.noteId}-${cloze.reference}-${cloze.marker}`)) continue;

            const term = Indexer.getFirstMatching(indexesState.terms.byNoteIdReferenceAndMarker, [
                cloze.noteId,
                cloze.reference,
                cloze.marker,
            ]);

            mapSome(term, term => {
                term.attributes.related?.forEach(related => !dedup(related) && terms.push(related));
            });

            if (r && !dedup(r)) terms.push(r);
        }
        return terms;
    }

    async startScan(curLanguage: string) {
        const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
        await this._updateState(cur => ({...cur, curLanguage, curTabId: tab.id}));
        console.log('starting scan....')

        const {scanSub} = this;
        scanSub.close();
        this.scanSub = new Subscription();
        await browser.scripting.executeScript({
            files: ['content.js'],
            target: {
                tabId: tab.id,
            }
        });
        await this.scanSub.promise;
    }
}

new BackgroundServer();