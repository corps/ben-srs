import {BensrsTester} from "../tester";
import {Subscription} from "kamo-reducers/subject";
import {test, testModule} from "../qunit";
import {loadIndexesWorkerName, localStoreKey} from "../../src/reducers/local-store-reducer";
import {genLocalStore} from "../factories/settings-factory";
import {loadLocalData} from "kamo-reducers/services/local-storage";
import {filesUploadRequestName, listFolderRequestName, startSync} from "../../src/reducers/sync-reducer";
import {State} from "../../src/state";
import {workComplete} from "kamo-reducers/services/workers";
import {doIndexesLoadingWork} from "../../src/services/worker";
import {Indexer} from "redux-indexers";
import {RequestAjax} from "kamo-reducers/services/ajax";
import {authInitialized} from "../../src/services/login";
import {isSideEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";

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

  stateOverwrite: Partial<State> = {};

  prepareState = runOnce(() => {
    tester.start();
    tester.dispatch(loadLocalData(localStoreKey, this.store));
    tester.dispatch(workComplete([loadIndexesWorkerName], doIndexesLoadingWork(this.store)));
    tester.dispatch(authInitialized);
    tester.state = {...tester.state, ...this.stateOverwrite};
  });


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

test("starting sync first cancels other sync actions", (assert) => {
  setup.prepareState();

  let clearSyncEffects: SideEffect = sequence(sequence({effectType: "b"}, {effectType: "c"}), {effectType: "a"});
  tester.state.clearSyncEffects = clearSyncEffects;
  setup.startSync();

  assert.equal(tester.state.startedSyncCount, 1);
  assert.equal(tester.findEffects("a", [tester.state.clearSyncEffects]).length, 0);
  assert.equal(tester.findEffects("b", [tester.state.clearSyncEffects]).length, 0);
  assert.equal(tester.findEffects("c", [tester.state.clearSyncEffects]).length, 0);

  let head = tester.queued$.queue[0];
  let effectNames: string[] = [];
  while (head && (!isSideEffect(head) || head.effectType !== "request-ajax")) {
    if (isSideEffect(head)) {
      effectNames.push(head.effectType);
    }
    tester.queued$.flushNext();
    head = tester.queued$.queue[0];
  }

  assert.notEqual(effectNames.indexOf("a"), -1);
  assert.notEqual(effectNames.indexOf("b"), -1);
  assert.notEqual(effectNames.indexOf("c"), -1);
});

test("syncing without any newNotes or localEdits = true notes immediately starts the downloadSync", (assert) => {
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
