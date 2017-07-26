import {
  DenormalizedNoteParts, newNormalizeCloze, newNormalizedNote, newNormalizedTerm, newSchedule,
  NormalizedCloze, NormalizedNote, NormalizedTerm
} from "../../src/model";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../../src/indexes";
// import * as uuid from "uuid";

let lastId = 0;
function genId() {
  return (++lastId) + "";
}

function genSomeText() {
  let amount = Math.floor(Math.random() * 4) * 10;
  var result = "";
  for (var i = 0; i < amount; ++i) {
    result += String.fromCharCode("a".charCodeAt(0) + Math.floor(Math.random() * 26))
  }
  return result;
}

export function loadNote(indexes: typeof indexesInitialState,
                         denormalized: DenormalizedNoteParts) {
  indexes = {...indexes};
  indexes.notes = notesIndexer.update(indexes.notes, [denormalized.note]);
  indexes.terms = termsIndexer.update(indexes.terms, denormalized.terms);
  indexes.clozes = clozesIndexer.update(indexes.clozes, denormalized.clozes);
  return indexes;
}

export class NoteFactory {
  note: NormalizedNote = JSON.parse(JSON.stringify({
    ...newNormalizedNote,
    attributes: {
      ...newNormalizedNote.attributes,
      language: "Japanese",
      content: genSomeText(),
    }
  }));

  addTerm() {
    let factory = new TermFactory();

    this.note.attributes.content += factory.term.attributes.reference + "[" + factory.term.attributes.marker + "]";
    this.note.attributes.content += genSomeText();

    return factory;
  }
}


export class TermFactory {
  term: NormalizedTerm = JSON.parse(JSON.stringify({
    ...newNormalizedTerm,
    attributes: {
      ...newNormalizedTerm.attributes,
      marker: genId(),
      reference: genId(),
      pronounce: genId(),
      definition: genSomeText(),
      hint: genSomeText(),
    },
  }));

  addCloze() {
    let factory = new ClozeFactory();
    this.term.attributes.clozes.push(factory.cloze);
    return factory;
  }
}

export class ClozeFactory {
  cloze: NormalizedCloze = JSON.parse(JSON.stringify({
    ...newNormalizeCloze,
    attributes: {
      ...newNormalizeCloze.attributes,
      schedule: {...newSchedule, lastAnsweredMinutes: ++lastId},
    },
  }));
}
