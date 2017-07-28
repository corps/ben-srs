import {BensrsTester} from "../tester";
import {test, testModule} from "../qunit";
import {Subscription} from "kamo-reducers/subject";
import {authSuccess} from "../../src/services/login";
import {clearLocalData} from "kamo-reducers/services/local-storage";

let tester: BensrsTester;
let subscription = new Subscription();

testModule("unit/login-reducer", {
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

  assert.expect(2);
  tester.start();
  tester.queued$.flushUntilEmpty();
  assert.equal(tester.state.authReady, true);
});

test("authSuccess sets the session parameters", (assert) => {
  tester.start();
  tester.dispatch(authSuccess("zach", "token123", 123456));

  assert.equal(tester.state.settings.session.sessionExpiresAt, 123456);
  assert.equal(tester.state.settings.session.accessToken, "token123");
  assert.equal(tester.state.settings.session.login, "zach");
});

test("authSuccess for an existing login updates in place without clearing storage", (assert) => {
  tester.start();
  tester.dispatch(authSuccess("zach", "token123", 123456));

  tester.state = {...tester.state};
  tester.state.settings = {...tester.state.settings};
  tester.state.settings.session = {...tester.state.settings.session};
  tester.state.settings.session.syncCursor = "cursor1";

  tester.dispatch(authSuccess("zach", "newToken", 554));

  assert.equal(tester.state.settings.session.sessionExpiresAt, 554);
  assert.equal(tester.state.settings.session.accessToken, "newToken");
  assert.equal(tester.state.settings.session.login, "zach");
  assert.equal(tester.state.settings.session.syncCursor, "cursor1");

  assert.equal(tester.findEffects(clearLocalData.effectType).length, 0);
});

test("authSuccess for a login different from the storage clears and resets storage and session", (assert) => {
  tester.start();
  tester.dispatch(authSuccess("zach", "token123", 123456));

  tester.state = {...tester.state};
  tester.state.settings = {...tester.state.settings};
  tester.state.settings.session = {...tester.state.settings.session};
  tester.state.settings.session.syncCursor = "cursor1";

  tester.dispatch(authSuccess("bob", "newToken", 554));

  assert.equal(tester.state.settings.session.sessionExpiresAt, 554);
  assert.equal(tester.state.settings.session.accessToken, "newToken");
  assert.equal(tester.state.settings.session.login, "bob");
  assert.equal(tester.state.settings.session.syncCursor, "");

  assert.equal(tester.findEffects(clearLocalData.effectType).length, 1);
});
