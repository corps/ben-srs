import {BensrsTester} from "../tester";
import {test, testModule} from "../qunit";
import {Subscription} from "kamo-reducers/subject";
import {
  loadLocalData,
  requestLocalData,
  RequestLocalData,
  StoreLocalData,
  clearLocalData
} from "kamo-reducers/services/local-storage";
import {windowFocus} from "../../src/services/window";
import {initialization} from "../../src/services/initialization";
import {loadIndexesWorkerName, settingsStoreKey} from "../../src/reducers/session-reducer";
import {RequestWork, WorkComplete} from "kamo-reducers/services/workers";
import {genLocalStore} from "../factories/settings-factory";
import {indexesInitialState, loadIndexables} from "../../src/indexes";
import {authInitialized, authSuccess, checkLoginSession} from "../../src/services/login";
import { updateTime } from 'kamo-reducers/services/time';

let tester: BensrsTester;
let subscription = new Subscription();

testModule("unit/session-reducer", {
  beforeEach: (assert) => {
    tester = new BensrsTester();
    subscription.add(tester.subscription.unsubscribe);
  },

  afterEach: () => {
    subscription.unsubscribe();
  }
});

test("on initialization and window focus, loads localStore data", (assert) => {
  tester.start();

  tester.dispatch(initialization());

  let localDataRequests: RequestLocalData[] =
    tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 1);

  tester.dispatch(updateTime(0, 0));
  tester.dispatch(windowFocus());

  localDataRequests = tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 1);
  assert.deepEqual(localDataRequests[0].key, settingsStoreKey);

  tester.dispatch({type: "no-op"});

  localDataRequests = tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 0);
});

test("on a recent window focus, does not request a localStore data", (assert) => {
  tester.start();

  tester.dispatch(initialization());

  let localDataRequests: RequestLocalData[] =
    tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 1);

  tester.dispatch(updateTime(5000, 5000));
  tester.dispatch(windowFocus(5000));

  localDataRequests = tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 0);
});

test("on loading an empty set of data, will load empty indexes", (assert) => {
  tester.start();

  tester.dispatch(loadLocalData(settingsStoreKey, undefined));
  let workRequests: RequestWork[] = tester.findEffects("request-work") as any[];
  assert.equal(workRequests.length, 0);

  tester.dispatch(authInitialized);
  workRequests = tester.findEffects("request-work") as any[];
  assert.equal(workRequests.length, 1);
  assert.deepEqual(workRequests[0].name, [loadIndexesWorkerName]);
  assert.deepEqual(workRequests[0].data, []);
});

test("on loading an a localStore object, eventually loads all the expected data into the state, and kicks off a sync", (assert) => {
  tester.start();

  let store = genLocalStore();

  let finish = assert.async();

  let originalStateCount = tester.state.startedSyncCount;

  tester.update$.subscribe(([a, s]) => {
    if (a.type === "work-complete") {
      let work = a as WorkComplete;
      assert.deepEqual(work.name, [loadIndexesWorkerName]);

      assert.deepEqual(s.indexes, loadIndexables(indexesInitialState, store.indexables));
      assert.deepEqual(s.settings, store.settings);
      assert.deepEqual(s.newNotes, store.newNotes);

      assert.equal(s.indexesReady, true);
      assert.equal(s.authReady, true);
      assert.equal(s.startedSyncCount, originalStateCount + 1);
      finish();
    }
  });

  assert.expect(8);
  tester.dispatch(loadLocalData(settingsStoreKey, store));
  assert.equal(tester.findEffects(checkLoginSession.effectType).length, 1);

  tester.queued$.buffering = false;
  tester.dispatch(authInitialized);
});

test("saves the current store on auth-success", (assert) => {
  tester.start();

  let store = genLocalStore();
  tester.dispatch(loadLocalData(settingsStoreKey, store));
  tester.dispatch(authSuccess(store.settings.session.login, "token", 1234));
  let stored: StoreLocalData[] = tester.findEffects("store-local-data") as any[];

  store.settings.session.accessToken = "token";
  store.settings.session.sessionExpiresAt = 1234;

  assert.equal(stored.length, 1);
  assert.equal(stored[0].key, settingsStoreKey);
  assert.deepEqual(stored[0].data, store);
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
