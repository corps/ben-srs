import {memoizeBySomeProperties} from "kamo-reducers/memoizers";
import {initialState} from "../state";
import {Language, Note} from "../model";
import {Indexer} from "redux-indexers";

export const computeLanguages = memoizeBySomeProperties({
  indexes: {notes: initialState.indexes.notes}
}, (state): Language[] => {
  let result = [] as Language[];
  let note: Note | 0 = null;
  let language: Language = null;

  while (note = Indexer.iterator(state.indexes.notes.byLanguage, [language, Infinity])()) {
    language = note.attributes.language;
    result.push(language);
  }

  return result;
});

export const computeCurLanguageDefault = memoizeBySomeProperties({
  inputs: {curLanguage: initialState.inputs.curLanguage},
  languages: initialState.languages
}, (state): Language => {
  let language = state.inputs.curLanguage;

  if (state.languages.indexOf(language) === -1) {
    return state.languages[0] || "English";
  }

  return language;
});

