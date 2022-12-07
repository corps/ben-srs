import 'regenerator-runtime';
import {deferred, ListenController, restartable, SendController, Subscription} from "./utils";
import {runPromise} from "../cancellable";
import {syncFiles} from "../services/sync";
import {Dropbox, DropboxAuth} from "dropbox";
import {DropboxSyncBackend} from "../services/dropbox";
import {FileStore, normalizeBlob, readText} from "../services/storage";
import {Dexie} from "dexie";
import {
    denormalizedNote,
    getLanguagesOfNotes,
    indexesInitialState,
    NormalizedNote,
    parseNote, stringifyNote, Term,
    updateNotes
} from "../notes";
import {Indexer} from "../utils/indexable";
import {mapSome, mapSomeAsync, Maybe} from "../utils/maybe";
import {Answer} from "../scheduler";
import {answerStudy} from "../study";
import {BensrsClient} from "../services/bensrs";


const state = {
    curTerms: [] as Term[],
    curLanguage: "",
    loaded: false,
    languages: [] as string[],
    newNote: null as Maybe<NormalizedNote>,
    selectBuffer: "",
    version: 0,
}
const indexesState = {...indexesInitialState};
const filestore = new FileStore(new Dexie("bensrs"))

export type PublicState = typeof state;

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
        indexesState,
        true
    )
    console.log('finished syncing files')
})


const restartLoad = restartable(function* () {
    Object.assign(indexesState, {...indexesInitialState});
    const noteBlobs = yield* runPromise(filestore.fetchBlobsByExt('txt'));
    for (let {blob, id, rev, path} of noteBlobs) {
        const contents = yield readText(normalizeBlob(blob));
        const normalized = parseNote(contents);
        const denormalized = denormalizedNote(normalized, id, path, rev);
        updateNotes(indexesState, denormalized);
    }
    console.log('done loading blobs')
});

export class BackgroundServer extends ListenController<"bg"> {
    updateSub = new Subscription();
    scanSub = new Subscription();

    constructor() {
        super("bg");
        restartLoad().add(() => {
            state.loaded = true;
            state.languages = getLanguagesOfNotes(indexesState.notes);
            this._fireUpdate();
        })
    }

    _fireUpdate() {
        state.version += 1;
        const {updateSub} = this;
        this.updateSub = new Subscription();
        updateSub.close();
    }

    async finishScanning()  {
        this.scanSub.close();
    }

    async clear() {
        state.curTerms = [];
        state.selectBuffer = "";
        this._fireUpdate();
    }

    async setSelectBuffer() {
        state.selectBuffer = "";
        this._fireUpdate();
    }

    async awaitUpdate(cur: PublicState): Promise<PublicState> {
        if (cur.version == state.version){
            const [promise, resolve] = deferred<PublicState>()
            this.updateSub.add(() => resolve({...state}));
            return promise;
        } else {
            return Promise.resolve({...state});
        }
    }

    async answerTerm(term: Term, answer: Answer) {
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

    async selectTerm(termString: string) {
        browser.action.openPopup();
        state.curTerms = [];
        const termIter = Indexer.iterator(indexesState.terms.byReference, [termString], [termString, Infinity])
        for (let term = termIter(); term; term = termIter()) {
            state.curTerms.push(term[0]);
        }

        const taggedTermIter = Indexer.iterator(indexesState.taggedTerms.byTag, [termString], [termString, Infinity]);
        for (let term = taggedTermIter(); term; term = taggedTermIter()) {
            state.curTerms.push(term[0].inner);
        }

        this._fireUpdate();
    }

    async startSync(accessToken = "", clientId = "") {
        if (!accessToken || !clientId) {
            const {host} = await browser.storage.local.get("host");
            const client = new BensrsClient(host)
            const result = await client.callJson(
                BensrsClient.LoginEndpoint,
                {}
            );
            if (!result.success) return;
            accessToken = result.access_token || "";
            clientId = result.app_key || "";
        }

        try {
            await restartSync(accessToken, clientId);
        } finally {
            state.languages = getLanguagesOfNotes(indexesState.notes);
            this._fireUpdate();
        }
    }

    async getTerms() {
        const iterator = Indexer.iterator(indexesState.taggedClozes.byTagSpokenAndNextDue,
            [state.curLanguage, false, true],
            [state.curLanguage, false, true, Date.now() / 1000 / 60])
        const terms: string[] = [];
        const v: Record<string, boolean> = {};
        const dedup = (r: string) => {
            if (v[r]) return true;
            v[r] = true;
            return false
        }

        for (let next = iterator(); !!next; next = iterator()) {
            const cloze = next[0].inner;
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

    async startScan(language: string) {
        state.curLanguage = language;
        this._fireUpdate();

        const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
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