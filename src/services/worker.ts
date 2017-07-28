import {LocalStore} from "../reducers/local-store-reducer";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../indexes";

self.onmessage = (ev) => {
  let data = ev.data as LocalStore;

  let indexes = {...indexesInitialState};
  indexes.clozes = clozesIndexer.update(indexes.clozes, data.clozes);
  indexes.notes = notesIndexer.update(indexes.notes, data.notes);
  indexes.terms = termsIndexer.update(indexes.terms, data.terms);

  (self.postMessage as any)(indexes);
}