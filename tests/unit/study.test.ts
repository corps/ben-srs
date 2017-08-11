import {test, testModule} from "../qunit";
import {newTerm} from "../../src/model";
import {
  findContentRange, findNextUniqueMarker, findTermRange, fullTermMarker, getTermFragment,
  studyDetailsForCloze
} from "../../src/study";
import {NoteFactory} from "../factories/notes-factories";
import {denormalizedNote, indexesInitialState, loadIndexables} from "../../src/indexes";
import {genSomeText} from "../factories/general-factories";
import {Indexer} from "redux-indexers";

testModule("unit/study");

test("findNextUniqueMarker finds the next marker that is not present anywhere in the given note", (assert) => {
  assert.equal(findNextUniqueMarker("some[0]values[1]with[2]thing"), "3");
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
  testTermRange("word", "1", "some word[1] stuff", [5, 12]);
  testTermRange("word", "2", "some word[1] stuff", [-1, -1]);
  testTermRange("word", "word1", "some word1 stuff", [5, 10]);
  testTermRange("word", "word", "some word stuff", [5, 9]);
  testTermRange("word", "ord", "some word stuff", [-1, -1]);
  testTermRange("word", "word1", "some word2 stuff", [-1, -1]);
});

test("findContentRange", (assert) => {
  function testContentRange(reference: string, marker: string, text: string,
                            grabCharacters: number, expected: string) {
    let term = {...newTerm};
    term.attributes = {...term.attributes};
    term.attributes.reference = reference;
    term.attributes.marker = marker;

    let [s, e] = findContentRange(term, text, grabCharacters);
    assert.deepEqual(text.slice(s, e), expected);
  }

  testContentRange("notinhere", "1", "This is some text here", 5, "");
  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 100,
    "word[1]is this long.  And there would be more.  And more here");

  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 25,
    "word[1]is this long.  And there would");

  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 21,
    "word[1]is this long.  And there");

  testContentRange("word", "1", "word[1]is this long.  And there would be more.  And more here", 12,
    "word[1]is this long");

  testContentRange("word", "1",
    "Part , Yes Thing No No No.word[1]is this long.  And there would be more.  And more here", 100,
    "Part , Yes Thing No No No.word[1]is this long.  And there would be more.  And more here");

  testContentRange("word", "1",
    "Part , Yes Thing No No No.word[1]is this long.  And there would be more.  And more here", 24,
    "Part , Yes Thing No No No.word[1]is this long.  And there");

  testContentRange("word", "1",
    "Part , Yes Thing No No No.word[1]is this long.  And there would be more.  And more here", 13,
    "Thing No No No.word[1]is this long.");
});

test("studyDetailsForCloze", (assert) => {
  let indexes = {...indexesInitialState};

  let factory = new NoteFactory();
  let termFactory = factory.addTerm();
  termFactory.addCloze();

  let denormalized = denormalizedNote(factory.note, genSomeText(), genSomeText(), "");
  indexes = loadIndexables(indexes, [denormalized]);

  factory = new NoteFactory();
  termFactory = factory.addTerm();
  termFactory.addCloze();

  termFactory = factory.addTerm("abaddf");
  let clozeFactory = termFactory.addCloze();
  clozeFactory.cloze.attributes.clozed = "a";
  clozeFactory = termFactory.addCloze();
  clozeFactory.cloze.attributes.clozed = "a";
  clozeFactory = termFactory.addCloze();
  clozeFactory.cloze.attributes.clozed = "d";

  termFactory = factory.addTerm();
  termFactory.addCloze();

  denormalized = denormalizedNote(factory.note, genSomeText(), genSomeText(), "");
  indexes = loadIndexables(indexes, [denormalized]);

  let terms = factory.note.attributes.terms;
  let targetTerm = terms[1];
  let clozes = Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [
    denormalized.note.id, targetTerm.attributes.reference
  ]);

  assert.equal(clozes.length, 3);

  let termPlusMarker = fullTermMarker(targetTerm);
  let content = getTermFragment(factory.note, targetTerm, termPlusMarker);

  assert.deepEqual(studyDetailsForCloze(clozes[0], indexes), {
    afterCloze: targetTerm.attributes.reference.slice(1),
    afterTerm: content.slice(content.indexOf(termPlusMarker) + termPlusMarker.length),
    beforeCloze: "",
    beforeTerm: content.slice(0, content.indexOf(termPlusMarker)),
    cloze: clozes[0],
    clozed: "a",
    content,
    hint: targetTerm.attributes.hint,
    type: clozes[0].attributes.type,
    definition: targetTerm.attributes.definition,
    spoken: content.replace(termPlusMarker, targetTerm.attributes.pronounce),
  });

  assert.deepEqual(studyDetailsForCloze(clozes[1], indexes), {
    afterCloze: targetTerm.attributes.reference.slice(3),
    afterTerm: content.slice(content.indexOf(termPlusMarker) + termPlusMarker.length),
    beforeCloze: "ab",
    beforeTerm: content.slice(0, content.indexOf(termPlusMarker)),
    cloze: clozes[1],
    clozed: "a",
    content,
    hint: targetTerm.attributes.hint,
    type: clozes[1].attributes.type,
    definition: targetTerm.attributes.definition,
    spoken: content.replace(termPlusMarker, targetTerm.attributes.pronounce),
  });

  assert.deepEqual(studyDetailsForCloze(clozes[2], indexes), {
    afterCloze: targetTerm.attributes.reference.slice(4),
    afterTerm: content.slice(content.indexOf(termPlusMarker) + termPlusMarker.length),
    beforeCloze: "aba",
    beforeTerm: content.slice(0, content.indexOf(termPlusMarker)),
    cloze: clozes[2],
    clozed: "d",
    content,
    hint: targetTerm.attributes.hint,
    type: clozes[2].attributes.type,
    definition: targetTerm.attributes.definition,
    spoken: content.replace(termPlusMarker, targetTerm.attributes.pronounce),
  });
});