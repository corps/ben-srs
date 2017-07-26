import {BensrsTester} from "../tester";
import {test, testModule} from "../qunit";
import {Subscription} from "kamo-reducers/subject";

let tester: BensrsTester;
let subscription = new Subscription();

testModule("e2e/sync", {
  beforeEach: (assert) => {
    tester = new BensrsTester();
    subscription.add(tester.subscription.unsubscribe);
  },

  afterEach: () => {
    subscription.unsubscribe();
  }
});

test("authInitialized is first false, then true after auth-initialized", (assert) => {
  let unsubscribe = tester.update$.subscribe((update) => {
    let [action, state] = update;
    if (action.type !== "auth-initialized") {
      assert.equal(state.authReady, false);

      unsubscribe();
    }
  });

  tester.start();
  tester.queued$.flushUntilEmpty();
  assert.equal(tester.state.authReady, true);
});
