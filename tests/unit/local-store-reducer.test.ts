import {BensrsTester} from "../tester";
import {test, testModule} from "../qunit";
import {Subscription} from "kamo-reducers/subject";
import {loadLocalData, requestLocalData, RequestLocalData, StoreLocalData} from "kamo-reducers/services/local-storage";
import {windowFocus} from "../../src/services/window";
import {initialization} from "../../src/services/initialization";
import {loadIndexesWorkerName, localStoreKey, newLocalStore} from "../../src/reducers/local-store-reducer";
import {RequestWork, WorkComplete} from "kamo-reducers/services/workers";
import {genLocalStore} from "../factories/settings-factory";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../../src/indexes";
import {authInitialized, authSuccess} from "../../src/services/login";

let tester: BensrsTester;
let subscription = new Subscription();

testModule("unit/local-store-reducer", {
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

  tester.dispatch(initialization);

  let localDataRequests: RequestLocalData[] =
    tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 1);

  tester.dispatch(windowFocus);

  localDataRequests = tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 1);
  assert.deepEqual(localDataRequests[0].key, localStoreKey);

  tester.dispatch({type: "no-op"});

  localDataRequests = tester.findEffects(requestLocalData("").effectType) as any[];
  assert.equal(localDataRequests.length, 0);
});

test("on loading an empty set of data, begins loading the newLocalStore data", (assert) => {
  tester.start();

  tester.dispatch(loadLocalData(localStoreKey, undefined));
  let workRequests: RequestWork[] = tester.findEffects("request-work") as any[];

  assert.equal(workRequests.length, 1);
  assert.deepEqual(workRequests[0].name, [loadIndexesWorkerName]);
  assert.deepEqual(workRequests[0].data, newLocalStore);
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

      let indexes = {...indexesInitialState};
      indexes.notes = notesIndexer.update(indexes.notes, store.notes);
      indexes.terms = termsIndexer.update(indexes.terms, store.terms);
      indexes.clozes = clozesIndexer.update(indexes.clozes, store.clozes);

      assert.deepEqual(s.indexes, indexes);
      assert.deepEqual(s.settings, store.settings);
      assert.deepEqual(s.newNotes, store.newNotes);

      assert.equal(s.indexesReady, true);
      assert.equal(s.authReady, true);
      assert.equal(s.startedSyncCount, originalStateCount + 1);
      finish();
    }
  });

  assert.expect(7);
  tester.queued$.buffering = false;
  tester.dispatch(authInitialized);
  tester.dispatch(loadLocalData(localStoreKey, store));
});

test("multiple overlapping store loads would cancel each other's work", (assert) => {
  tester.start();

  let firstStore = genLocalStore();
  let store = genLocalStore();

  let finish = assert.async();

  tester.update$.subscribe(([a, s]) => {
    if (a.type === "work-complete") {
      let work = a as WorkComplete;
      assert.deepEqual(work.name, [loadIndexesWorkerName]);
      assert.deepEqual(s.settings, store.settings);
      assert.deepEqual(s.awaiting, []);
      finish();
    }
  });

  assert.expect(3);
  tester.queued$.buffering = false;
  tester.dispatch(loadLocalData(localStoreKey, firstStore));
  tester.dispatch(loadLocalData(localStoreKey, store));
});

test("saves the current store on auth-success", (assert) => {
  tester.start();

  let store = genLocalStore();
  tester.dispatch(loadLocalData(localStoreKey, store));
  tester.dispatch(authSuccess(store.settings.session.login, "token", 1234));
  let stored: StoreLocalData[] = tester.findEffects("store-local-data") as any[];

  store.settings.session.accessToken = "token";
  store.settings.session.sessionExpiresAt = 1234;

  assert.equal(stored.length, 1);
  assert.equal(stored[0].key, localStoreKey);
  assert.deepEqual(stored[0].data, store);
});