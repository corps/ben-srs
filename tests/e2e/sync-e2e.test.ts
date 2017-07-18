import {assert, test, testModule} from "../qunit";
import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscription} from "kamo-reducers/subject";

let latestCursor = "";
let actions$: Subject<GlobalAction>;
let effect$: Subject<SideEffect>;
let subscription = new Subscription();


testModule("e2e/sync", {
  beforeEach: (assert) => {
    actions$ = new Subject();
    effect$ = new Subject();
  },

  afterEach: () => {
    subscription.unsubscribe();
  }
});

// Test this face
test("can upload / download a large batch data", () => {
  assert.ok(process.env.DROPBOX_TEST_ACCESS_TOKEN, "DROPBOX_TEST_ACCESS_TOKEN was not set");
  if (!process.env.DROPBOX_TEST_ACCESS_TOKEN) return;


});
