import {test, testModule} from "../qunit";
import {setupDropbox} from "./dropbox-test-utils";
import {Tester} from "../tester";
import {Subscription} from "kamo-reducers/subject";

let latestCursor = "";
let subscription = new Subscription();
let token = process.env.DROPBOX_TEST_ACCESS_TOKEN as string;
let tester: Tester;

testModule("e2e/sync", {
  beforeEach: (assert) => {
    tester = new Tester(true);
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

// Test that we can start sync from 0 safely.
test("can start sync from 0 safely", (assert) => {
  let finish = assert.async();
  subscription.add(tester.update$.subscribe(([action, state]) => {
    console.log(tester.queued$.queue.length, state.awaiting);
    if (state.awaiting.length == 0 && tester.queued$.queue.length == 0) {
      assert.equal(tester.state.authReady, true);
      assert.equal(tester.state.indexesReady, true);
      assert.equal(tester.state.syncAuthBad, true);
      finish();
    }
  }));
});

// Add a bunch of test data and verify
