import {test, testModule} from "../qunit";
import {NoteFactory} from "../factories/notes-factories";
import {denormalizedNote, findNoteTree, indexesInitialState, loadIndexables, normalizedNote} from "../../src/indexes";

testModule("unit/indexes");

test("normalizedNote / findNoteTree / denormalizedNote", (assert) => {
  for (let i = 0; i < 1000; ++i) {
    let factory = new NoteFactory();
    for (let i = Math.random() * 3; i > 0; i--) {
      let termFactory = factory.addTerm();
      for (let j = Math.random() * 3; j > 0; j--) {
        let clozeFactory = termFactory.addCloze();
        for (let k = Math.random() * 3; k > 0; k--) {
          clozeFactory.addAnswer();
        }
      }
    }

    let denormalized = denormalizedNote(factory.note, "id", "path", "version");
    let indexes = loadIndexables(indexesInitialState, [denormalized]);
    let renormalized = normalizedNote(findNoteTree(indexes, "id") || null);

    assert.deepEqual(factory.note, JSON.parse(JSON.stringify(renormalized)));
  }
});