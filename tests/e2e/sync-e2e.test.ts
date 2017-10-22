import {assert, Assert, test, testModule} from "../qunit";
import {deletePath, setupDropbox, testPath} from "./dropbox-test-utils";
import {Subscription} from "kamo-reducers/subject";
import {BensrsTester} from "../tester";
import {NoteFactory} from "../factories/notes-factories";
import {
  newSettings,
  Term,
  Note,
  newTerm,
  newCloze,
  newClozeAnswer,
} from "../../src/model";
import {localStoreKey, newLocalStore} from "../../src/reducers/session-reducer";
import uuid = require("uuid");
import {storeLocalData} from "kamo-reducers/services/local-storage";
import {windowFocus} from "../../src/services/window";
import {Indexer} from "redux-indexers";
import {isSideEffect} from "kamo-reducers/reducers";
import {setImmediate} from "timers";
import {
  findNoteTree,
  loadIndexables,
  normalizedNote,
  notesIndexer,
} from "../../src/indexes";
import {startSync} from "../../src/reducers/sync-reducer";

let subscription = new Subscription();
let token = process.env.DROPBOX_TEST_ACCESS_TOKEN as string;
let tester: BensrsTester;

const testLocalStore = {...newLocalStore};

let settings = (testLocalStore.settings = {...newSettings});
settings.session = {...settings.session};
settings.session.accessToken = token;
settings.session.sessionExpiresAt = Date.now() * 10;

const initialSyncSize = 3;

testLocalStore.newNotes = {};
for (var i = 0; i < initialSyncSize; ++i) {
  let noteFactory = new NoteFactory();

  let termFactory = noteFactory.addTerm();
  termFactory.addCloze();
  termFactory.addCloze();

  termFactory = noteFactory.addTerm();
  termFactory.addCloze();
  termFactory.addCloze();

  termFactory = noteFactory.addTerm();
  termFactory.addCloze();
  termFactory.addCloze();

  testLocalStore.newNotes["/test/" + uuid.v4()] = JSON.parse(
    JSON.stringify(noteFactory.note)
  );
}

testModule("e2e/sync", {
  beforeEach: assert => {
    assert.timeout(15000);
    tester = new BensrsTester();
    subscription.add(tester.subscription.unsubscribe);

    if (!token) assert.ok(token, "DROPBOX_TEST_ACCESS_TOKEN was not set");

    let finish = assert.async();
    setupDropbox(token, (err: any, cursor: string) => {
      assert.ok(!err, "Got error setting up dropbox");
      settings.session.syncCursor = cursor;
      finish();
    });
  },

  afterEach: () => {
    subscription.unsubscribe();
  },
});

function sequenceChecks(assert: Assert, checks: Function[]) {
  if (checks.length === 0) return;

  let finish = assert.async();

  let inCheck = false;

  subscription.add(
    tester.queued$.subscribe(ea => {
      if (isSideEffect(ea)) {
        console.log("effect", ea);
      } else {
        console.log("action", ea);
      }
    })
  );

  subscription.add(
    tester.update$.subscribe(u => {
      if (inCheck) return;

      let next = checks.shift();

      if (next) {
        inCheck = true;
        let result = next();
        inCheck = false;
        if (result) {
          if (checks.length === 0) {
            finish();
          }
        } else {
          checks.unshift(next);
        }
      } else {
        finish();
      }
    })
  );
}

function loadCredentialsAndNewData() {
  tester.queued$.dispatch(storeLocalData(localStoreKey, testLocalStore));
  tester.queued$.dispatch(windowFocus());
}

function awaitInitialBadSync() {
  if (!tester.state.indexesReady || tester.state.finishedSyncCount < 1) {
    return false;
  }

  assert.equal(tester.state.authReady, true, "authReady");
  assert.equal(tester.state.indexesReady, true, "indexesReady");
  assert.equal(tester.state.syncAuthBad, true, "syncAuthBad");
  assert.equal(tester.state.syncOffline, false, "syncOffline");

  setImmediate(loadCredentialsAndNewData);

  return true;
}

function awaitNewSyncComplete() {
  if (tester.state.finishedSyncCount < 2) return false;

  assert.equal(tester.state.authReady, true, "authReady");
  assert.equal(tester.state.indexesReady, true, "indexesReady");
  assert.equal(tester.state.syncAuthBad, false, "syncAuthBad");
  assert.equal(tester.state.syncOffline, false, "syncOffline");

  assert.deepEqual(tester.state.newNotes, {}, "newNotes");
  assert.equal(
    tester.state.indexes.notes.byPath.length,
    initialSyncSize,
    "syncs all the original new notes"
  );

  for (var path in testLocalStore.newNotes) {
    let indexed = Indexer.getFirstMatching(
      tester.state.indexes.notes.byPath,
      path.split("/")
    );
    let newNote = JSON.parse(JSON.stringify(testLocalStore.newNotes[path]));

    assert.notEqual(indexed, null, "Note " + path + " in index");

    if (indexed && newNote) {
      newNote.attributes.terms.sort((a: Term, b: Term) => {
        if (a.attributes.reference != b.attributes.reference)
          return a.attributes.reference.localeCompare(b.attributes.reference);

        return a.attributes.marker.localeCompare(b.attributes.marker);
      });

      assert.notEqual(indexed.version, "", "Version is set");
      assert.notEqual(indexed.id, "", "Id is set");
      assert.equal(indexed.localEdits, false, "No Local edits");

      let tree = findNoteTree(tester.state.indexes, indexed.id);
      assert.ok(tree, "loaded into the state indexes");
      if (tree) {
        let normalized = normalizedNote(tree);
        assert.deepEqual(
          JSON.parse(JSON.stringify(normalized)),
          newNote,
          "Correctly deserialized the expected note"
        );
      }
    }
  }

  setImmediate(function() {
    var i = 0;
    var iter = Indexer.iterator(tester.state.indexes.notes.byId);
    for (var next = iter(); next && i < 6; next = iter()) {
      next = {...next};
      next.localEdits = true;

      next.attributes = {...next.attributes};
      next.attributes.content = "new new new content!";
      editedNotes.push(next);
      ++i;
    }
    tester.state.indexes = {...tester.state.indexes};
    tester.state.indexes.notes = notesIndexer.update(
      tester.state.indexes.notes,
      editedNotes
    );
    assert.equal(
      tester.state.indexes.notes.byId.length,
      initialSyncSize,
      "test precondition"
    );

    let {state, effect} = startSync(tester.state);
    tester.state = state;
    if (effect) {
      tester.queued$.dispatch(effect);
    }
  });

  return true;
}

var editedNotes: Note[] = [];

function awaitEditedSyncComplete() {
  if (tester.state.finishedSyncCount < 3) return false;

  assert.equal(
    tester.state.indexes.notes.byPath.length,
    initialSyncSize,
    "edited notes sync without creating new notes"
  );
  assert.notEqual(editedNotes.length, 0);

  for (var i = 0; i < editedNotes.length; ++i) {
    let editedNote = editedNotes[i];
    let indexed = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
      editedNote.id,
    ]);
    assert.ok(indexed);

    if (indexed) {
      assert.deepEqual(indexed.attributes, editedNote.attributes);
      assert.notEqual(indexed.version, editedNote.version);
      assert.equal(indexed.localEdits, false, "edited notes have localEdits set to false");

      editedNote = {...editedNote};
      editedNote.attributes = {...editedNote.attributes};
      editedNote.attributes.content = "more different content";
      editedNote.localEdits = true;
      tester.state.indexes = {...tester.state.indexes};
      tester.state.indexes.notes = notesIndexer.update(
        tester.state.indexes.notes,
        [editedNote]
      );
    }
  }

  setImmediate(function() {
    let {state, effect} = startSync(tester.state);
    tester.state = state;
    if (effect) {
      tester.queued$.dispatch(effect);
    }
  });

  return true;
}

function awaitEditedWithOlderRevision() {
  if (tester.state.finishedSyncCount < 4) return false;

  assert.equal(tester.state.indexes.notes.byPath.length, initialSyncSize);
  assert.notEqual(editedNotes.length, 0);

  for (var i = 0; i < editedNotes.length; ++i) {
    let editedNote = editedNotes[i];
    let indexed = Indexer.getFirstMatching(tester.state.indexes.notes.byId, [
      editedNote.id,
    ]);
    assert.ok(indexed);

    if (indexed) {
      // did not apply the change, due to version differences
      assert.deepEqual(indexed.attributes, editedNote.attributes);
      assert.equal(indexed.localEdits, false);
    }
  }

  setImmediate(function() {
    deletePath(testPath, token, err => {
      assert.notOk(err);

      let {state, effect} = startSync(tester.state);
      tester.state = state;
      if (effect) {
        tester.queued$.dispatch(effect);
      }
    });
  });

  return true;
}

function awaitDeletedSync() {
  if (tester.state.finishedSyncCount < 5) return false;

  assert.equal(tester.state.indexes.notes.byPath.length, 0, "every note was deleted");
  assert.equal(tester.state.indexes.terms.byLanguage.length, 0, "every term was deleted");
  assert.equal(tester.state.indexes.clozes.byLanguageAndNextDue.length, 0, "every close deleted");
  assert.equal(
    tester.state.indexes.clozeAnswers.byLanguageAndAnswered.length,
    0, "every cloze answer is deleted",
  );

  setImmediate(function() {
    let note = {...editedNotes[0]};
    note.localEdits = true;

    let term = {...newTerm};
    term.noteId = note.id;

    let cloze = {...newCloze};
    cloze.noteId = note.id;

    let clozeAnswer = {...newClozeAnswer};
    clozeAnswer.noteId = note.id;

    tester.state.indexes = loadIndexables(tester.state.indexes, [
      {
        note,
        terms: [term],
        clozes: [cloze],
        clozeAnswers: [clozeAnswer],
      },
    ]);

    let {state, effect} = startSync(tester.state);
    tester.state = state;
    if (effect) {
      tester.queued$.dispatch(effect);
    }
  });

  return true;
}

function awaitConflictOfDeleteSync() {
  if (tester.state.finishedSyncCount < 6) return false;

  assert.equal(tester.state.indexes.notes.byPath.length, 0);
  assert.equal(tester.state.indexes.terms.byLanguage.length, 0);
  assert.equal(tester.state.indexes.clozes.byLanguageAndNextDue.length, 0);
  assert.equal(
    tester.state.indexes.clozeAnswers.byLanguageAndAnswered.length,
    0
  );

  return true;
}

if (process.env.E2E_TEST) {
  test("syncing, saving new, editing, deleting", assert => {
    assert.timeout(600000);

    sequenceChecks(assert, [
      awaitInitialBadSync,
      awaitNewSyncComplete,
      awaitEditedSyncComplete,
      awaitEditedWithOlderRevision,
      awaitDeletedSync,
      awaitConflictOfDeleteSync,
    ]);

    tester.queued$.buffering = false;
    tester.start();
  });
}
