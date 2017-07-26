import {assert, Assert, test, testModule} from "../qunit";
import {setupDropbox} from "./dropbox-test-utils";
import {Subscription} from "kamo-reducers/subject";
import {BensrsTester} from "../tester";
import {NoteFactory} from "../factories/notes-factories";
import {newSettings, normalizedNote} from "../../src/model";
import {localStoreKey, newLocalStore} from "../../src/reducers/local-store-reducer";
import uuid = require("uuid");
import {storeLocalData} from "kamo-reducers/services/local-storage";
import {windowFocus} from "../../src/services/window";
import {Indexer} from "redux-indexers";

let latestCursor = "";
let subscription = new Subscription();
let token = process.env.DROPBOX_TEST_ACCESS_TOKEN as string;
let tester: BensrsTester;

const testLocalStore = {...newLocalStore};

let settings = testLocalStore.settings = {...newSettings};
settings.session = {...settings.session};
settings.session.accessToken = token;
settings.session.syncCursor = latestCursor;
settings.session.sessionExpiresAt = Infinity;

testLocalStore.newNotes = {};
for (var i = 0; i < 100; ++i) {
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

  testLocalStore.newNotes["test/" + uuid.v4()] = JSON.parse(JSON.stringify(noteFactory.note));
}

testModule("e2e/sync", {
  beforeEach: (assert) => {
    tester = new BensrsTester();
    subscription.add(tester.subscription.unsubscribe);

    if (!token) assert.ok(token, "DROPBOX_TEST_ACCESS_TOKEN was not set");

    let finish = assert.async();
    setupDropbox(token, (err: any, cursor: string) => {
      assert.ok(!err, "Got error setting up dropbox");
      latestCursor = cursor;

      finish();
    });
  },

  afterEach: () => {
    subscription.unsubscribe();
  }
});

function sequenceChecks(assert: Assert, checks: Function[]) {
  if (checks.length === 0) return;

  let finish = assert.async();

  subscription.add(tester.update$.subscribe(() => {
    let next = checks.shift();

    if (next) {
      if (next()) {
        if (checks.length === 0) {
          finish();
        }
      } else {
        checks.unshift(next);
      }
    } else {
      finish();
    }
  }));
}

function loadCredentialsAndNewData() {
  tester.queued$.dispatch(storeLocalData(localStoreKey, testLocalStore));
  tester.queued$.dispatch(windowFocus);
  return true;
}

function awaitInitialBadSync() {
  if (tester.state.awaiting.length > 0) {
    assert.equal(tester.state.indexesReady, false);
  }

  if (tester.state.awaiting.length == 0 && tester.queued$.stack.length == 1) {
    assert.equal(tester.state.authReady, true);
    assert.equal(tester.state.indexesReady, true);
    assert.equal(tester.state.syncAuthBad, true);
    assert.equal(tester.state.syncOffline, false);


    return true;
  }
  return false;
}

function awaitNewSyncComplete() {
  if (tester.state.awaiting.length == 0) {
    assert.equal(tester.state.authReady, true);
    assert.equal(tester.state.indexesReady, true);
    assert.equal(tester.state.syncAuthBad, false);
    assert.equal(tester.state.syncOffline, false);

    assert.deepEqual(tester.state.newNotes, {});
    assert.equal(tester.state.indexes.notes.byPath.length, 100);

    for (var path in testLocalStore.newNotes) {
      let indexed = Indexer.getFirstMatching(tester.state.indexes.notes.byPath, [path]);
      let newNote = testLocalStore.newNotes[path];

      assert.notEqual(indexed, null);

      if (indexed) {
        assert.notEqual(indexed.version, "");
        assert.notEqual(indexed.id, "");
        assert.notEqual(indexed.localEdits, false);
        let terms = Indexer.getAllMatching(tester.state.indexes.terms.byNoteIdReferenceAndMarker, [indexed.id]);
        let clozes = Indexer.getAllMatching(tester.state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [indexed.id]);
        assert.deepEqual(normalizedNote(indexed, terms, clozes), newNote);
      }
    }

    return true;
  }
  return false;
}

if (process.env.E2E_TEST) {
// Test that we can start sync from 0 safely.
  test("can start sync from 0 safely", (assert) => {
    sequenceChecks(assert, [
      awaitInitialBadSync,
      loadCredentialsAndNewData,
      awaitNewSyncComplete,
    ]);

    tester.queued$.buffering = false;
    tester.start();
  });
}
// Add a bunch of test data and verify
