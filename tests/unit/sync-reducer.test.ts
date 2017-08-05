import {BensrsTester} from "../tester";
import {Subscription} from "kamo-reducers/subject";
import {assert, test, testModule} from "../qunit";
import {loadIndexesWorkerName, localStoreKey, requestLocalStoreUpdate} from "../../src/reducers/local-store-reducer";
import {genLocalStore} from "../factories/settings-factory";
import {loadLocalData} from "kamo-reducers/services/local-storage";
import {
  DropboxDeleteEntry, DropboxFileEntry,
  DropboxListFolderResponse,
  filesDownloadRequestName, filesUploadRequestName, listFolderRequestName, requestFileDownload, requestFileUpload,
  requestListFolder,
  startSync
} from "../../src/reducers/sync-reducer";
import {State} from "../../src/state";
import {workComplete} from "kamo-reducers/services/workers";
import {doIndexesLoadingWork} from "../../src/services/worker";
import {Indexer} from "redux-indexers";
import {
  RequestAjax, AbortRequest, completeRequest, requestAjax,
  encodeResponseHeaders
} from "kamo-reducers/services/ajax";
import {authInitialized} from "../../src/services/login";
import {isSideEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {NoteFactory} from "../factories/notes-factories";
import {NormalizedNote, Note, Session, stringifyNote} from "../../src/model";
import {genId, genSomeText} from "../factories/general-factories";
import {
  genDeleteEntry, genDownloadResponse, genDropboxListFolderResponse,
  genFileEntry
} from "../factories/responses-factories";
import {denormalizedNote, findNoteTree, loadIndexables, normalizedNote} from "../../src/indexes";

let tester: BensrsTester;
let subscription = new Subscription();
let setup: SyncTestSetup;

testModule("unit/sync-reducer", {
  beforeEach: (assert) => {
    tester = new BensrsTester();
    subscription.add(tester.subscription.unsubscribe);

    setup = new SyncTestSetup();
  },

  afterEach: () => {
    subscription.unsubscribe();
  }
});

function runOnce(f: () => void): () => void {
  var run = false;
  return function () {
    if (run) return;
    run = true;
    f.apply(this, arguments);
  }
}

class SyncTestSetup {
  store = genLocalStore();

  session: Session;
  stateOverwrite: Partial<State> = {};

  prepareState = runOnce(() => {
    tester.start();
    tester.dispatch(loadLocalData(localStoreKey, this.store));
    tester.dispatch(workComplete([loadIndexesWorkerName], doIndexesLoadingWork(this.store)));
    tester.dispatch(authInitialized);
    tester.state = {...tester.state, ...this.stateOverwrite};

    this.session = tester.state.settings.session;

  });

  completeFileUploadRequest(normalized: NormalizedNote, path = genSomeText(), version = "") {
    let session = tester.state.settings.session;

    tester.dispatch(completeRequest(requestFileUpload(
      session.accessToken, normalized, path, version), 200, "", ""));
  }

  completeFileUploadRequestConflict(normalized: NormalizedNote, path = genSomeText(), version = "") {
    let session = tester.state.settings.session;

    tester.dispatch(completeRequest(requestFileUpload(
      session.accessToken, normalized, path, version), 409, "", ""));
  }

  completeListFolderRequest(listFolderResponse: DropboxListFolderResponse) {
    let session = tester.state.settings.session;

    tester.dispatch(completeRequest(requestListFolder(
      session.accessToken, session.syncCursor), 200,
      JSON.stringify(listFolderResponse), ""))
  }

  completeFileDownloadRequest(fileEntry: DropboxFileEntry) {
    let session = tester.state.settings.session;

    let noteFactory = new NoteFactory().withSomeData();
    let normalized = noteFactory.note;

    tester.dispatch(completeRequest(requestFileDownload(
      session.accessToken, session.syncCursor), 200,
      stringifyNote(normalized), encodeResponseHeaders({
        "Dropbox-API-Result": JSON.stringify(genDownloadResponse(fileEntry))
      })));

    return normalized;
  }

  prepareWithEdited = runOnce(() => {
    setup.addNote(true);
    setup.addNote(true);
    setup.prepareState();

    assert.ok(Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [true]));
    assert.ok(Object.keys(tester.state.newNotes).length);
  });

  editedNotes: NormalizedNote[] = [];
  addNote = (edited = false, path = genSomeText()): [Note, NormalizedNote] => {
    let factory = new NoteFactory();
    let term = factory.addTerm();
    term.addCloze();

    this.editedNotes.push(factory.note);

    let denormalized = denormalizedNote(factory.note, "id:" + genId(), path, genSomeText());
    denormalized.note.localEdits = edited;
    this.store.indexables.push(denormalized);

    return [denormalized.note, factory.note];
  };

  addDeletedNote = (): [Note, DropboxDeleteEntry] => {
    let deleteEntry = genDeleteEntry();
    let parentFolder = deleteEntry.path_lower.split("/")[0];
    let [note] = setup.addNote(false, parentFolder + "/" + genSomeText());
    return [note, deleteEntry];
  };

  startSync = runOnce(() => {
    this.prepareState();
    let reduction = startSync(tester.state);
    if (reduction.effect)
      tester.queued$.dispatch(reduction.effect);
    tester.state = reduction.state;
  });
}

test("starting sync resets bad sync state", (assert) => {
  setup.prepareState();
  tester.state.syncAuthBad = true;
  tester.state.syncOffline = true;

  setup.startSync();
  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(tester.state.syncAuthBad, false);
  assert.equal(tester.state.syncOffline, false);
});

test("completing a file upload saves the state", (assert) => {
  setup.prepareState();

  tester.dispatch(completeRequest(requestAjax([filesUploadRequestName, "", ""], {
    url: "/",
    method: "GET",
  }), 200, "", ""));

  let storeEffect = requestLocalStoreUpdate(tester.state);
  assert.deepEqual(tester.findEffects(storeEffect.effectType)[0], storeEffect);
});

[filesUploadRequestName, filesDownloadRequestName, listFolderRequestName].forEach(rn => {
  test(`failing a ${rn} cancels the sync`, (assert) => {
    setup.prepareState();

    tester.state = {...tester.state};
    tester.state.clearSyncEffects = {effectType: "clear-it"};
    tester.dispatch(completeRequest(requestAjax([rn], {
      url: "/",
      method: "GET",
    }), 500, "", ""));

    assert.equal(tester.findEffects("clear-it").length, 1);
    assert.equal(tester.state.syncOffline, true);
  });
});

test(`failing other requests does not bother the sync`, (assert) => {
  setup.prepareState();

  tester.state = {...tester.state};
  tester.state.clearSyncEffects = {effectType: "clear-it"};
  tester.dispatch(completeRequest(requestAjax(["Abcdefg"], {
    url: "/",
    method: "GET",
  }), 500, "", ""));

  assert.equal(tester.findEffects("clear-it").length, 0);
  assert.equal(tester.state.syncOffline, false);
});

test("completing a file upload clears localEdits of existing file", (assert) => {
  let [note, normalized] = setup.addNote(true);
  setup.prepareState();

  assert.ok(note.localEdits);
  assert.ok(Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note.id]));

  setup.startSync();
  setup.completeFileUploadRequest(normalized, note.id, note.version);

  let updatedNote = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note.id]);
  assert.ok(updatedNote);
  if (updatedNote) {
    assert.notOk(updatedNote.localEdits);
    assert.deepEqual(updatedNote.attributes, note.attributes);
  }
});

test("completing a file upload with 409 clears localEdits and sets hasConflicts of existing file", (assert) => {
  let [note, normalized] = setup.addNote(true);
  setup.prepareState();

  assert.ok(note.localEdits);
  assert.ok(Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note.id]));

  setup.startSync();
  setup.completeFileUploadRequestConflict(normalized, note.id, note.version);

  let updatedNote = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note.id]);
  assert.ok(updatedNote);
  if (updatedNote) {
    assert.notOk(updatedNote.localEdits);
    assert.ok(updatedNote.hasConflicts);
    assert.deepEqual(updatedNote.attributes, note.attributes);
  }
});

test("a list folder response issues requests for each file entry, which is aborted on sync reset", (assert) => {
  setup.prepareState();

  let listFolderResponse = genDropboxListFolderResponse();

  let fileEntry1 = genFileEntry();
  let fileEntry2 = genFileEntry();
  listFolderResponse.entries.push(fileEntry1);
  listFolderResponse.entries.push(fileEntry2);
  listFolderResponse.entries.push(genDeleteEntry());
  setup.completeListFolderRequest(listFolderResponse);

  assert.ok(tester.state.clearSyncEffects)

  if (tester.state.clearSyncEffects) {
    let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];
    let ajaxNames = ajaxes.map(ajax => ajax.name.join("-"));
    let aborts: AbortRequest[] = tester.findEffects("abort-request", [tester.state.clearSyncEffects]) as any[];

    assert.equal(aborts.filter(abort => ajaxNames.indexOf(abort.name.join("-")) !== -1).length, ajaxes.length);
    assert.equal(ajaxes.length, 2);
  }
});

test("syncedNotes don't override local edits", (assert) => {
  let [note1] = setup.addNote(true);
  let newFileEntry1 = genFileEntry();
  newFileEntry1.id = note1.id;

  let [note2] = setup.addNote(false);
  let newFileEntry2 = genFileEntry();
  newFileEntry2.id = note2.id;

  setup.prepareState();

  assert.ok(Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note1.id]));
  assert.ok(Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note2.id]));

  let listFolderResponse = genDropboxListFolderResponse();
  listFolderResponse.entries.push(newFileEntry1);
  listFolderResponse.entries.push(newFileEntry2);
  setup.completeListFolderRequest(listFolderResponse);

  setup.completeFileDownloadRequest(newFileEntry1);
  let normalized2 = setup.completeFileDownloadRequest(newFileEntry2);

  let newNote1 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [newFileEntry1.id]);
  let newNote2 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [newFileEntry2.id]);

  assert.ok(newNote1);
  assert.ok(newNote2);

  if (newNote1 && newNote2) {
    assert.strictEqual(newNote1, note1);

    assert.equal(newNote2.version, newFileEntry2.rev);
    assert.equal(newNote2.path, newFileEntry2.path_lower);

    let normalizedNewNote2 =
      normalizedNote(findNoteTree(tester.state.indexes, newNote2.id) || null);

    assert.deepEqual(normalized2, JSON.parse(JSON.stringify(normalizedNewNote2)));
  }
});

test("removes hasConflicts from downloaded notes", (assert) => {
  let newFileEntry1 = genFileEntry();
  setup.prepareState();

  let noteFactory = new NoteFactory().withSomeData();
  let denormalized = denormalizedNote(noteFactory.note, newFileEntry1.id, "", "");
  denormalized.note.hasConflicts = true;
  tester.state.indexes = loadIndexables(tester.state.indexes, [denormalized]);

  let listFolderResponse = genDropboxListFolderResponse();
  // listFolderResponse.entries.push(newFileEntry1);
  setup.completeListFolderRequest(listFolderResponse);
  let downloaded = setup.completeFileDownloadRequest(newFileEntry1);
  assert.deepEqual(downloaded, JSON.parse(JSON.stringify(normalizedNote(findNoteTree(tester.state.indexes, newFileEntry1.id) || null))));

  let note1 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [newFileEntry1.id]);
  assert.ok(note1);

  if (note1) {
    assert.equal(note1.hasConflicts, false);
  }
});

test("applies deletes and updated notes after all requests complete, storing the result", (assert) => {
  let newFileEntry1 = genFileEntry();
  let newFileEntry2 = genFileEntry();
  let [deletedNote, deleteNoteEntry] = setup.addDeletedNote();

  setup.prepareState();

  assert.ok(Indexer.getFirstMatching(tester.state.indexes.notes.byId, [deletedNote.id]));
  assert.ok(Indexer.getFirstMatching(tester.state.indexes.terms.byNoteIdReferenceAndMarker, [deletedNote.id]));
  assert.ok(Indexer.getFirstMatching(tester.state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [deletedNote.id]));

  let originalNotes = tester.state.indexes.notes;
  let listFolderResponse = genDropboxListFolderResponse();

  listFolderResponse.entries.push(newFileEntry1);
  listFolderResponse.entries.push(newFileEntry2);
  listFolderResponse.entries.push(deleteNoteEntry);
  setup.completeListFolderRequest(listFolderResponse);

  assert.strictEqual(originalNotes, tester.state.indexes.notes);

  setup.completeFileDownloadRequest(newFileEntry1);
  assert.strictEqual(originalNotes, tester.state.indexes.notes);
  assert.equal(tester.findEffects("store-local-data").length, 0);

  setup.completeFileDownloadRequest(newFileEntry2);
  assert.equal(tester.findEffects("store-local-data").length, 1);

  assert.notOk(Indexer.getFirstMatching(tester.state.indexes.notes.byId, [deletedNote.id]));
  assert.notOk(Indexer.getFirstMatching(tester.state.indexes.terms.byNoteIdReferenceAndMarker, [deletedNote.id]));
  assert.notOk(Indexer.getFirstMatching(tester.state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [deletedNote.id]));

  let note1 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [newFileEntry1.id]);
  let note2 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [newFileEntry2.id]);

  assert.ok(note1);
  assert.ok(note2);

  if (note1 && note2) {
    assert.equal(note1.version, newFileEntry1.rev);
    assert.equal(note2.version, newFileEntry2.rev);

    assert.equal(note1.path, newFileEntry1.path_lower);
    assert.equal(note2.path, newFileEntry2.path_lower);
  }
});

test("a complete list request with a has_more = true will trigger another complete list", (assert) => {
  setup.prepareState();
  let listFolderResponse = genDropboxListFolderResponse();
  listFolderResponse.has_more = true;
  setup.completeListFolderRequest(listFolderResponse);

  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];
  assert.equal(ajaxes.filter(ajax => ajax.name[0] === listFolderRequestName).length, 1);

  listFolderResponse = genDropboxListFolderResponse();
  listFolderResponse.has_more = false;
  setup.completeListFolderRequest(listFolderResponse);

  ajaxes = tester.findEffects("request-ajax") as any[];
  assert.equal(ajaxes.filter(ajax => ajax.name[0] === listFolderRequestName).length, 0);
});

test("a list folder response with no downloads just completes the sync and updates the token", (assert) => {
  setup.prepareState();

  let listFolderResponse = genDropboxListFolderResponse();
  setup.completeListFolderRequest(listFolderResponse);

  let storeUpdate = requestLocalStoreUpdate(tester.state);
  let storeUpdates = tester.findEffects(storeUpdate.effectType);
  assert.deepEqual(storeUpdates[0], storeUpdate);

  tester.queued$.flushUntilEmpty();

  assert.deepEqual(tester.state.awaiting, []);
  assert.equal(tester.state.syncAuthBad, false);
  assert.equal(tester.state.syncOffline, false);
});

test("starting sync first cancels other sync actions", (assert) => {
  setup.prepareState();

  let clearSyncEffects: SideEffect = sequence(sequence({effectType: "b"}, {effectType: "c"}), {effectType: "a"});
  tester.state.clearSyncEffects = clearSyncEffects;
  setup.startSync();

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(tester.findEffects("a", [tester.state.clearSyncEffects]).length, 0);
  assert.equal(tester.findEffects("b", [tester.state.clearSyncEffects]).length, 0);
  assert.equal(tester.findEffects("c", [tester.state.clearSyncEffects]).length, 0);

  let effectNames: string[] = [];
  while (!tester.queued$.isEmpty()) {
    let head = tester.queued$.peek();

    if (isSideEffect(head)) {
      if (head.effectType === "request-ajax") break;
      effectNames.push(head.effectType);
    }

    tester.queued$.flushNext();
  }

  assert.notEqual(effectNames.indexOf("a"), -1);
  assert.notEqual(effectNames.indexOf("b"), -1);
  assert.notEqual(effectNames.indexOf("c"), -1);
});

test("syncing with newNotes and localEdits requests writes for each of those that are added to clearSyncEffects", (assert) => {
  setup.prepareWithEdited();
  setup.startSync();

  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  assert.ok(ajaxes.length);

  assert.equal(ajaxes.filter(a => a.name[0] === filesUploadRequestName).length, ajaxes.length);
  assert.equal(ajaxes.length, setup.editedNotes.length + Object.keys(tester.state.newNotes).length);

  let aborts: AbortRequest[] = tester.state.clearSyncEffects && tester.findEffects("abort-request", [tester.state.clearSyncEffects]) as any[];
  assert.deepEqual(ajaxes.map(a => a.name), aborts.map(a => a.name));
});

test("syncing without any newNotes or localEdits = true notes immediately starts the downloadSync", (assert) => {
  setup.stateOverwrite.newNotes = {};
  setup.prepareState();
  assert.equal(Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [true]), null);

  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(ajaxes.filter(x => x.name[0] === filesUploadRequestName).length, 0);
  assert.equal(ajaxes.filter(x => x.name[0] === filesDownloadRequestName).length, 0);
  assert.equal(ajaxes.filter(x => x.name[0] === listFolderRequestName).length, 1);
});

test("sync adds a abortSync to the clearSync", (assert) => {
  setup.stateOverwrite.newNotes = {};
  setup.prepareState();
  assert.equal(Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [true]), null);

  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  let folderAjaxes = ajaxes.filter(x => x.name[0] === listFolderRequestName);
  assert.equal(folderAjaxes.length, 1);

  assert.ok(tester.state.clearSyncEffects);
  if (tester.state.clearSyncEffects) {
    let aborts: AbortRequest[] = tester.findEffects("abort-request", [tester.state.clearSyncEffects]) as any[];
    assert.equal(aborts.filter(a => a.name.join("-") === folderAjaxes[0].name.join("-")).length, 1);
  }
});

test("starting download begins with a list request added to the clear sync", (assert) => {
  setup.stateOverwrite.newNotes = {};
  setup.prepareState();
  assert.equal(Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [true]), null);

  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(ajaxes.filter(x => x.name[0] === filesUploadRequestName).length, 0);
  assert.equal(ajaxes.filter(x => x.name[0] === listFolderRequestName).length, 1);
});

test("syncing with authReady = false just quietly fails", (assert) => {
  setup.stateOverwrite.authReady = false;
  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(ajaxes.length, 0);
  assert.equal(tester.state.startedSyncCount, 0);
});

test("syncing with indexesReady = false just quietly fails", (assert) => {
  setup.stateOverwrite.indexesReady = false;
  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(ajaxes.length, 0);
  assert.equal(tester.state.startedSyncCount, 0);
});
