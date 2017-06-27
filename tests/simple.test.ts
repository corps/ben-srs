import {assert, test, testModule} from "./qunit";

testModule("simple");

test("thing", () => {
  assert.ok(true);
});