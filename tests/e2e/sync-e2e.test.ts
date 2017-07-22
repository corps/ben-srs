import {assert, Assert, test, testModule} from "../qunit";
import {setupDropbox} from "./dropbox-test-utils";
import {Subscription} from "kamo-reducers/subject";
import {BensrsTester} from "../tester";
import {IndexesFactory, NoteFactory, TermFactory} from "../factories/notes-factories";
import {initialState} from "../../src/state";
import {indexesInitialState} from "../../src/indexes";
import {newSettings} from "../../src/model";
import {requestLocalStoreUpdate} from "../../src/reducers/local-store-reducer";

let latestCursor = "";
let subscription = new Subscription();
let token = process.env.DROPBOX_TEST_ACCESS_TOKEN as string;
let tester: BensrsTester;

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
  }))
}

function loadCredentialsAndNewData() {
  let indexes = {...indexesInitialState};
  let settings = {...newSettings};

  settings.session = {...settings.session};
  settings.session.accessToken = token;
  settings.session.syncCursor = latestCursor;
  settings.session.sessionExpiresAt = Infinity;

  let factory = new IndexesFactory();

  for (var i = 0; i < 100; ++i) {
    let noteFactory = new NoteFactory();
    factory.addFactory(noteFactory);

    let termFactory = noteFactory.addTermFactory(new TermFactory());
  }

  indexes = factory.loaded(indexes);

  tester.queued$.dispatch(requestLocalStoreUpdate({indexes, settings}));
  return true;
}

function awaitInitialBadSync() {
  if (tester.state.awaiting.length == 0 && tester.queued$.stack.length == 1) {
    assert.equal(tester.state.authReady, true);
    assert.equal(tester.state.indexesReady, true);
    assert.equal(tester.state.syncAuthBad, true);


    return true;
  }
  return false;
}

if (process.env.E2E_TEST) {
// Test that we can start sync from 0 safely.
  test("can start sync from 0 safely", (assert) => {
    sequenceChecks(assert, [
      awaitInitialBadSync
    ]);

    tester.queued$.buffering = false;
    tester.start();
  });
}
// Add a bunch of test data and verify
