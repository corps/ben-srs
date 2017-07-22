import {test, testModule} from "../qunit";
import {newNote} from "../../src/model";
import {findNextUniqueMarker} from "../../src/study";

testModule("unit/study");

test("findNextUniqueMarker finds the next marker that is not present anywhere in the given note", (assert) => {
  let note = {...newNote};
  note.attributes = {...note.attributes};
  note.attributes.content = "some[0]values[1]with[2]thing";

  assert.equal(findNextUniqueMarker(note), "3");
});