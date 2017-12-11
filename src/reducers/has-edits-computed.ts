import {memoizeBySomeProperties} from "kamo-reducers/memoizers";
import {initialState} from "../state";
import {Indexer} from "redux-indexers";

export const computeHasEdits = memoizeBySomeProperties({
  indexes: initialState.indexes,
  newNotes: initialState.newNotes
}, (state) => {
  for (var k in state.newNotes) {
    k;
    return true;
  }

  return !!Indexer.iterator(state.indexes.notes.byHasLocalEdits, [true], [true, Infinity])();
});
