import {BensrsTester} from "../tester";
import {Subscription} from "kamo-reducers/subject";
import {assert, test, testModule} from "../qunit";
import {
  loadIndexesWorkerName,
  settingsStoreKey,
  requestLocalStoreUpdate,
} from "../../src/reducers/session-reducer";
import {genLocalStore} from "../factories/settings-factory";
import {loadLocalData} from "kamo-reducers/services/local-storage";
import {
  DropboxDeleteEntry,
  DropboxFileEntry,
  DropboxListFolderResponse,
  filesDownloadRequestName,
  filesUploadRequestName,
  listFolderRequestName,
} from "../../src/services/dropbox";
import {startSync} from "../../src/reducers/sync-reducer";
import {State} from "../../src/state";
import {workComplete} from "kamo-reducers/services/workers";
import {doIndexesLoadingWork} from "../../src/services/worker";
import {Indexer} from "redux-indexers";
import {
  RequestAjax,
  AbortRequest,
  completeRequest,
  requestAjax,
  encodeResponseHeaders,
} from "kamo-reducers/services/ajax";
import {authInitialized} from "../../src/services/login";
import {SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {NoteFactory} from "../factories/notes-factories";
import {NormalizedNote, Note, Session, stringifyNote} from "../../src/model";
import {genId, genSomeText} from "../factories/general-factories";
import {
  genDeleteEntry,
  genDownloadResponse,
  genDropboxListFolderResponse,
  genFileEntry,
} from "../factories/responses-factories";
import {
  denormalizedNote,
  findNoteTree,
  loadIndexables,
  normalizedNote,
} from "../../src/indexes";
import {requestFileDownload} from "../../src/reducers/sync-reducer";
import {requestListFolder} from "../../src/reducers/sync-reducer";
import {requestFileUpload} from "../../src/reducers/sync-reducer";
import {newNormalizedNote} from "../../src/model";
import {NoteTree} from "../../src/indexes";

let tester: BensrsTester;
let subscription = new Subscription();
let setup: SyncTestSetup;

testModule("unit/sync-reducer", {
  beforeEach: assert => {
    tester = new BensrsTester();
    subscription.add(tester.subscription.unsubscribe);

    setup = new SyncTestSetup();
  },

  afterEach: () => {
    subscription.unsubscribe();
  },
});

function runOnce(f: () => void): () => void {
  var run = false;
  return function() {
    if (run) return;
    run = true;
    f.apply(this, arguments);
  };
}

class SyncTestSetup {
  store = genLocalStore();

  session: Session;
  stateOverwrite: Partial<State> = {};

  prepareState = runOnce(() => {
    tester.start();
    tester.dispatch(loadLocalData(settingsStoreKey, this.store));
    tester.dispatch(
      workComplete(
        [loadIndexesWorkerName],
        doIndexesLoadingWork(this.store.indexables)
      )
    );
    tester.dispatch(authInitialized);
    tester.state = {...tester.state, ...this.stateOverwrite};

    this.session = tester.state.settings.session;
  });

  completeFileUploadRequest(
    normalized: NormalizedNote,
    path = genSomeText(),
    version = ""
  ) {
    let session = tester.state.settings.session;

    tester.dispatch(
      completeRequest(
        requestFileUpload(
          session.accessToken,
          path,
          version,
          stringifyNote(normalized)
        ),
        200,
        "",
        ""
      )
    );
  }

  completeFileUploadRequestConflict(
    normalized: NormalizedNote,
    path = genSomeText(),
    version = ""
  ) {
    let session = tester.state.settings.session;

    tester.dispatch(
      completeRequest(
        requestFileUpload(
          session.accessToken,
          path,
          version,
          stringifyNote(normalized)
        ),
        409,
        "",
        ""
      )
    );
  }

  completeListFolderRequest(listFolderResponse: DropboxListFolderResponse) {
    let session = tester.state.settings.session;

    tester.dispatch(
      completeRequest(
        requestListFolder(session.accessToken, session.syncCursor),
        200,
        JSON.stringify(listFolderResponse),
        ""
      )
    );
  }

  completeConflictedNoteFileDownloadRequest(note: Note) {
    let session = tester.state.settings.session;

    let noteFactory = new NoteFactory().withSomeData();
    let normalized = noteFactory.note;

    tester.dispatch(
      completeRequest(
        requestFileDownload(session.accessToken, note.id),
        200,
        stringifyNote(normalized),
        encodeResponseHeaders({
          "Dropbox-API-Result": JSON.stringify({
            id: note.id,
            rev: note.version,
            path_lower: "/" + genSomeText(),
          }),
        })
      )
    );

    return normalized;
  }

  completeFileDownloadRequest(fileEntry: DropboxFileEntry) {
    let session = tester.state.settings.session;

    let noteFactory = new NoteFactory().withSomeData();
    let normalized = noteFactory.note;

    tester.dispatch(
      completeRequest(
        requestFileDownload(session.accessToken, "rev:" + fileEntry.rev),
        200,
        stringifyNote(normalized),
        encodeResponseHeaders({
          "Dropbox-API-Result": JSON.stringify(genDownloadResponse(fileEntry)),
        })
      )
    );

    return normalized;
  }

  prepareWithEdited = runOnce(() => {
    setup.addNote(true);
    setup.addNote(true);
    setup.prepareState();

    assert.ok(
      Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [
        true,
      ])
    );
    assert.ok(Object.keys(tester.state.newNotes).length);
  });

  editedNotes: NoteTree[] = [];
  addNote = (edited = false, path = genSomeText()): [Note, NormalizedNote] => {
    let factory = new NoteFactory();
    let term = factory.addTerm();
    term.addCloze();

    let denormalized = denormalizedNote(
      factory.note,
      "id:" + genId(),
      path,
      genSomeText()
    );
    denormalized.note.localEdits = edited;

    if (this.store.indexables instanceof Array) {
      this.store.indexables.push(denormalized);
    } else {
      this.store.indexables = [this.store.indexables, denormalized];
    }
    this.editedNotes.push(denormalized);

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
    if (reduction.effect) tester.queued$.dispatch(reduction.effect);
    tester.state = reduction.state;
  });
}

test("starting sync resets bad sync state", assert => {
  setup.prepareState();
  tester.state.syncAuthBad = true;
  tester.state.syncOffline = true;

  setup.startSync();
  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(tester.state.syncAuthBad, false);
  assert.equal(tester.state.syncOffline, false);
});

test("completing a file upload saves the state", assert => {
  setup.prepareState();

  tester.dispatch(
    completeRequest(
      requestAjax([filesUploadRequestName, "", ""], {
        url: "/",
        method: "GET",
      }),
      200,
      "",
      ""
    )
  );

  let storeEffect = requestLocalStoreUpdate(tester.state);
  assert.deepEqual(tester.findEffects(storeEffect.effectType)[0], storeEffect);
});

[
  filesUploadRequestName,
  filesDownloadRequestName,
  listFolderRequestName,
].forEach(rn => {
  test(`failing a ${rn} cancels the sync`, assert => {
    setup.prepareState();

    tester.state = {...tester.state};
    tester.state.clearSyncEffects = {effectType: "clear-it"};
    tester.dispatch(
      completeRequest(
        requestAjax([rn], {
          url: "/",
          method: "GET",
        }),
        500,
        "",
        ""
      )
    );

    assert.equal(tester.findEffects("clear-it").length, 1);
    assert.equal(tester.state.syncOffline, true);
  });
});

test(`failing other requests does not bother the sync`, assert => {
  setup.prepareState();

  tester.state = {...tester.state};
  tester.state.clearSyncEffects = {effectType: "clear-it"};
  tester.dispatch(
    completeRequest(
      requestAjax(["Abcdefg"], {
        url: "/",
        method: "GET",
      }),
      500,
      "",
      ""
    )
  );

  assert.equal(tester.findEffects("clear-it").length, 0);
  assert.equal(tester.state.syncOffline, false);
});

test("completing a file upload clears localEdits of existing file", assert => {
  let [note, normalized] = setup.addNote(true);
  setup.prepareState();

  assert.ok(note.localEdits);
  assert.ok(
    Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note.id])
  );

  setup.startSync();
  setup.completeFileUploadRequest(normalized, note.id, note.version);

  let updatedNote = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    note.id,
  ]);
  assert.ok(updatedNote);
  if (updatedNote) {
    assert.notOk(updatedNote.localEdits);
    assert.deepEqual(updatedNote.attributes, note.attributes);
  }
});

test("completing a file upload with 409 clears localEdits and sets hasConflicts of existing file", assert => {
  let [note, normalized] = setup.addNote(true);
  setup.prepareState();

  assert.ok(note.localEdits);
  assert.ok(
    Indexer.getFirstMatching(tester.state.indexes.notes.byId, [note.id])
  );

  setup.startSync();
  setup.completeFileUploadRequestConflict(normalized, note.id, note.version);

  let updatedNote = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    note.id,
  ]);
  assert.ok(updatedNote);
  if (updatedNote) {
    assert.notOk(updatedNote.localEdits);
    assert.ok(updatedNote.hasConflicts);
    assert.deepEqual(updatedNote.attributes, note.attributes);
  }
});

test("a list folder response issues a request for the next file entry", assert => {
  setup.prepareState();

  let listFolderResponse = genDropboxListFolderResponse();

  let fileEntry1 = genFileEntry();
  let fileEntry2 = genFileEntry();
  listFolderResponse.entries.push(fileEntry1);
  listFolderResponse.entries.push(fileEntry2);
  listFolderResponse.entries.push(genDeleteEntry());
  setup.completeListFolderRequest(listFolderResponse);

  assert.ok(tester.state.clearSyncEffects);

  if (tester.state.clearSyncEffects) {
    let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];
    let ajaxNames = ajaxes.map(ajax => ajax.name.join("-"));
    let aborts: AbortRequest[] = tester.findEffects("abort-request", [
      tester.state.clearSyncEffects,
    ]) as any[];

    assert.equal(
      aborts.filter(abort => ajaxNames.indexOf(abort.name.join("-")) !== -1)
        .length,
      ajaxes.length
    );
    assert.equal(ajaxes.length, 1);
  }
});

test("removes hasConflicts from downloaded notes", assert => {
  let newFileEntry1 = genFileEntry();
  setup.prepareState();

  let noteFactory = new NoteFactory().withSomeData();
  let denormalized = denormalizedNote(
    noteFactory.note,
    newFileEntry1.id,
    "",
    ""
  );

  denormalized.note.hasConflicts = true;
  tester.state.indexes = loadIndexables(tester.state.indexes, [denormalized]);

  let listFolderResponse = genDropboxListFolderResponse();
  setup.completeListFolderRequest(listFolderResponse);

  let downloaded = setup.completeConflictedNoteFileDownloadRequest(
    denormalized.note
  );
  assert.deepEqual(
    downloaded,
    JSON.parse(
      JSON.stringify(
        normalizedNote(
          findNoteTree(tester.state.indexes, newFileEntry1.id) || null
        )
      )
    )
  );

  let note1 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    newFileEntry1.id,
  ]);
  assert.ok(note1);

  if (note1) {
    assert.equal(note1.hasConflicts, false);
  }
});

test("applies deletes and updated notes after all requests complete, but stores all intermediate results", assert => {
  let newFileEntry1 = genFileEntry();
  let newFileEntry2 = genFileEntry();
  let [deletedNote, deleteNoteEntry] = setup.addDeletedNote();

  setup.prepareState();

  assert.ok(
    Indexer.getFirstMatching(tester.state.indexes.notes.byId, [deletedNote.id])
  );
  assert.ok(
    Indexer.getFirstMatching(
      tester.state.indexes.terms.byNoteIdReferenceAndMarker,
      [deletedNote.id]
    )
  );
  assert.ok(
    Indexer.getFirstMatching(
      tester.state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
      [deletedNote.id]
    )
  );

  let originalNotes = tester.state.indexes.notes;
  let listFolderResponse = genDropboxListFolderResponse();

  listFolderResponse.entries.push(newFileEntry1);
  listFolderResponse.entries.push(newFileEntry2);
  listFolderResponse.entries.push(deleteNoteEntry);
  setup.completeListFolderRequest(listFolderResponse);
  assert.strictEqual(
    originalNotes,
    tester.state.indexes.notes,
    "test precondition"
  );

  assert.strictEqual(originalNotes, tester.state.indexes.notes);

  setup.completeFileDownloadRequest(newFileEntry1);
  assert.strictEqual(
    originalNotes,
    tester.state.indexes.notes,
    "does not apply the download yet"
  );
  assert.equal(tester.findEffects("store-local-data").length, 1);

  let note1 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    newFileEntry1.id,
  ]);
  let note2 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    newFileEntry2.id,
  ]);
  assert.notOk(note1);
  assert.notOk(note2);

  setup.completeFileDownloadRequest(newFileEntry2);
  assert.equal(tester.findEffects("store-local-data").length, 1);

  assert.notOk(
    Indexer.getFirstMatching(tester.state.indexes.notes.byId, [deletedNote.id])
  );
  assert.notOk(
    Indexer.getFirstMatching(
      tester.state.indexes.terms.byNoteIdReferenceAndMarker,
      [deletedNote.id]
    )
  );
  assert.notOk(
    Indexer.getFirstMatching(
      tester.state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
      [deletedNote.id]
    )
  );

  note1 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    newFileEntry1.id,
  ]);
  note2 = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
    newFileEntry2.id,
  ]);
  assert.ok(note1);
  assert.ok(note2);

  if (note1 && note2) {
    assert.equal(note1.version, newFileEntry1.rev);
    assert.equal(note2.version, newFileEntry2.rev);

    assert.equal(note1.path, newFileEntry1.path_lower);
    assert.equal(note2.path, newFileEntry2.path_lower);
  }
});

test("a complete list request with a has_more = true will trigger another complete list", assert => {
  setup.prepareState();
  let listFolderResponse = genDropboxListFolderResponse();
  listFolderResponse.has_more = true;
  setup.completeListFolderRequest(listFolderResponse);

  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];
  assert.equal(
    ajaxes.filter(ajax => ajax.name[0] === listFolderRequestName).length,
    1
  );

  listFolderResponse = genDropboxListFolderResponse();
  listFolderResponse.has_more = false;
  setup.completeListFolderRequest(listFolderResponse);

  ajaxes = tester.findEffects("request-ajax") as any[];
  assert.equal(
    ajaxes.filter(ajax => ajax.name[0] === listFolderRequestName).length,
    0
  );
});

test("a list folder response with no downloads just completes the sync and updates the token", assert => {
  setup.prepareState();

  let listFolderResponse = genDropboxListFolderResponse();
  setup.completeListFolderRequest(listFolderResponse);

  let storeUpdate = requestLocalStoreUpdate(tester.state);
  let storeUpdates = tester.findEffects(storeUpdate.effectType);
  assert.deepEqual(storeUpdates[0], storeUpdate);

  tester.queued$.flushUntilEmpty();

  assert.deepEqual(tester.state.awaiting["sync"], 0);
  assert.equal(tester.state.syncAuthBad, false);
  assert.equal(tester.state.syncOffline, false);
});

test("starting sync first cancels other sync actions", assert => {
  setup.prepareState();

  let clearSyncEffects: SideEffect = sequence(
    sequence({effectType: "b"}, {effectType: "c"}),
    {effectType: "a"}
  );

  tester.state.clearSyncEffects = clearSyncEffects;
  setup.startSync();

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(
    tester.findEffects("a", [tester.state.clearSyncEffects]).length,
    0
  );
  assert.equal(
    tester.findEffects("b", [tester.state.clearSyncEffects]).length,
    0
  );
  assert.equal(
    tester.findEffects("c", [tester.state.clearSyncEffects]).length,
    0
  );
});

test("syncing with newNotes and localEdits requests writes for each of those", assert => {
  setup.prepareWithEdited();
  setup.startSync();

  const expectedUploadNotePaths: string[] = Object.keys(
    tester.state.newNotes
  ).concat(setup.editedNotes.map(n => n.note.id));

  let uploadedNotePaths: string[] = [];

  assert.equal(tester.state.startedSyncCount, 1);

  while (true) {
    let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];
    if (ajaxes.length !== 1) break;
    assert.equal(ajaxes.length, 1, "Makes one request at a time.");
    if (ajaxes[0].name[0] !== filesUploadRequestName) break;
    assert.deepEqual(
      (tester.state.clearSyncEffects as AbortRequest).name,
      ajaxes[0].name
    );
    assert.equal(
      tester.state.clearSyncEffects && tester.state.clearSyncEffects.effectType,
      "abort-request"
    );
    uploadedNotePaths.push(ajaxes[0].name[1]);

    setup.completeFileUploadRequest(newNormalizedNote, ajaxes[0].name[1]);
  }

  uploadedNotePaths.sort();
  expectedUploadNotePaths.sort();
  assert.deepEqual(uploadedNotePaths, expectedUploadNotePaths);
});

test("syncing without any newNotes or localEdits = true notes immediately starts the downloadSync", assert => {
  setup.stateOverwrite.newNotes = {};
  setup.prepareState();
  assert.equal(
    Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [
      true,
    ]),
    null
  );

  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(
    ajaxes.filter(x => x.name[0] === filesUploadRequestName).length,
    0
  );
  assert.equal(
    ajaxes.filter(x => x.name[0] === filesDownloadRequestName).length,
    0
  );
  assert.equal(
    ajaxes.filter(x => x.name[0] === listFolderRequestName).length,
    1
  );
});

test("sync adds a abortSync to the clearSync", assert => {
  setup.stateOverwrite.newNotes = {};
  setup.prepareState();
  assert.equal(
    Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [
      true,
    ]),
    null
  );

  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  let folderAjaxes = ajaxes.filter(x => x.name[0] === listFolderRequestName);
  assert.equal(folderAjaxes.length, 1);

  assert.ok(tester.state.clearSyncEffects);
  if (tester.state.clearSyncEffects) {
    let aborts: AbortRequest[] = tester.findEffects("abort-request", [
      tester.state.clearSyncEffects,
    ]) as any[];
    assert.equal(
      aborts.filter(a => a.name.join("-") === folderAjaxes[0].name.join("-"))
        .length,
      1
    );
  }
});

test("starting download begins with a list request added to the clear sync", assert => {
  setup.stateOverwrite.newNotes = {};
  setup.prepareState();
  assert.equal(
    Indexer.getFirstMatching(tester.state.indexes.notes.byHasLocalEdits, [
      true,
    ]),
    null
  );

  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(
    ajaxes.filter(x => x.name[0] === filesUploadRequestName).length,
    0
  );
  assert.equal(
    ajaxes.filter(x => x.name[0] === listFolderRequestName).length,
    1
  );
});

test("syncing with authReady = false just quietly fails", assert => {
  setup.stateOverwrite.authReady = false;
  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(ajaxes.length, 0);
  assert.equal(tester.state.startedSyncCount, 0);
});

test("syncing with indexesReady = false just quietly fails", assert => {
  setup.stateOverwrite.indexesReady = false;
  setup.startSync();
  let ajaxes: RequestAjax[] = tester.findEffects("request-ajax") as any[];

  assert.equal(ajaxes.length, 0);
  assert.equal(tester.state.startedSyncCount, 0);
});
