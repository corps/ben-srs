import {assert, test, testModule} from "../qunit";
import {GlobalAction, renderLoop, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscription} from "kamo-reducers/subject";
import {initialState, State} from "../../src/state";
import {reducer} from "../../src/reducer";
import {getServices} from "../../src/services/index";
import {setupDropbox} from "./dropbox-test-utils";

// let latestCursor = "";
let subscription = new Subscription();
let token = process.env.DROPBOX_TEST_ACCESS_TOKEN as string;

// let runNextSideEffects: () => void;
// let dispatch: (a: GlobalAction) => void;
// let state$: Subject<State>;
// let actions: GlobalAction[];

testModule("e2e/sync", {
  beforeEach: (assert) => {
    // state$ = new Subject();
    // actions = [];

    if (!token) assert.ok(token, "DROPBOX_TEST_ACCESS_TOKEN was not set");

    let finish = assert.async();
    setupDropbox(token, (err: any) => {
      assert.ok(!err, "Got error setting up dropbox");

      let state = {...initialState};
      state.settings = {...state.settings};
      state.settings.session = {...state.settings.session};
      state.settings.session.accessToken = token;
      state.settings.session.sessionExpiresAt = Infinity;

      finish();
    });
  },

  afterEach: () => {
    subscription.unsubscribe();
  }
});

// Test this face
test("can upload / download a large batch data", () => {
  let finish = assert.async();

  dispatch()
});
