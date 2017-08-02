import {test, testModule} from "../qunit";
import {newNote, newTerm} from "../../src/model";
import {findContentRange, findNextUniqueMarker, findTermRange} from "../../src/study";

testModule("unit/study");

test("findNextUniqueMarker finds the next marker that is not present anywhere in the given note", (assert) => {
  let note = {...newNote};
  note.attributes = {...note.attributes};
  note.attributes.content = "some[0]values[1]with[2]thing";

  assert.equal(findNextUniqueMarker(note), "3");
});

test("findTermRange", (assert) => {
  function testTermRange(reference: string, marker: string, text: string, expected: [number, number]) {
    let term = {...newTerm};
    term.attributes = {...term.attributes};
    term.attributes.reference = reference;
    term.attributes.marker = marker;

    assert.deepEqual(findTermRange(term, text), expected);
  }

  testTermRange("word", "1", "some word1 stuff", [-1, -1]);
  testTermRange("word", "1", "some word[1] stuff", [-1, -1]);
  testTermRange("word", "2", "some word[1] stuff", [-1, -1]);
  testTermRange("word", "word1", "some word1 stuff", [-1, -1]);
  testTermRange("word", "word1", "some word2 stuff", [-1, -1]);
});

test("findContentRange", (assert) => {
  function testContentRange(reference: string, marker: string, text: string,
                            grabCharacters: number, expected: [number, number]) {
    let term = {...newTerm};
    term.attributes = {...term.attributes};
    term.attributes.reference = reference;
    term.attributes.marker = marker;

    assert.deepEqual(findContentRange(term, text, grabCharacters), expected);
  }

  testContentRange("notinhere", "1", "This is some text here", 5, [-1, -1]);
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 100, [-1, -1]);
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 50, [-1, -1]);
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 25, [-1, -1]);
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 12, [-1, -1]);
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 5, [-1, -1]);
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 1, [-1, -1]);

  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is this long.  And there would be more.  And more here", 100, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is this long.  And there would be more.  And more here", 50, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is this long.  And there would be more.  And more here", 25, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is this long.  And there would be more.  And more here", 12, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is this long.  And there would be more.  And more here", 5, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is this long.  And there would be more.  And more here", 1, [-1, -1]);

  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is", 100, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is", 50, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is", 25, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is", 12, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]is", 5, [-1, -1]);
  testContentRange("word", "1", "More. Sentence here word[2] for it.word[1]", 1, [-1, -1]);
});