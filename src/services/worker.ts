import {LocalStore} from "../reducers/local-store-reducer";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../indexes";

if (typeof importScripts === 'function') {
  self.onmessage = (ev) => {
    let data = ev.data as LocalStore;
    (self.postMessage as any)(doIndexesLoadingWork(data));
  }
}

export function doIndexesLoadingWork(data: LocalStore): typeof indexesInitialState {
  let indexes = {...indexesInitialState};
  indexes.clozes = clozesIndexer.update(indexes.clozes, data.clozes);
  indexes.notes = notesIndexer.update(indexes.notes, data.notes);
  indexes.terms = termsIndexer.update(indexes.terms, data.terms);
  return indexes;
}
