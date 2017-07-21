import {Cloze, Note, Term} from "../../src/model";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../../src/indexes";

export class IndexesFactory {
  notes: Note[] = [];
  terms: Term[] = [];
  clozes: Cloze[] = [];

  loaded(indexes: typeof indexesInitialState) {
    indexes = {...indexes};

    indexes.notes = notesIndexer.update(indexes.notes, this.notes);
    indexes.terms = termsIndexer.update(indexes.terms, this.terms);
    indexes.clozes = clozesIndexer.update(indexes.clozes, this.clozes);

    return indexes;
  }
}


