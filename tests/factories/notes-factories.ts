import {
  DenormalizedNoteParts, newNormalizeCloze, newNormalizedNote, newNormalizedTerm, newSchedule,
  NormalizedCloze, NormalizedNote, NormalizedTerm
} from "../../src/model";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../../src/indexes";
import {genId, genNum, genSomeText} from "./general-factories";

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

  addTerm(reference = genId(), postContent = " " + genSomeText() + " ") {
    let factory = new TermFactory(reference);

    this.note.attributes.content += factory.term.attributes.reference + "[" + factory.term.attributes.marker + "]";
    this.note.attributes.content += postContent;
    this.note.attributes.terms.push(factory.term);

    return factory;
  }


}


export class TermFactory {
  constructor(public reference = genId()) {}

  term: NormalizedTerm = JSON.parse(JSON.stringify({
    ...newNormalizedTerm,
    attributes: {
      ...newNormalizedTerm.attributes,
      marker: genId(),
      reference: this.reference,
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
      schedule: {...newSchedule, lastAnsweredMinutes: genNum()},
    },
  }));
}
