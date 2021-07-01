import {Inputs, SearchResult, State} from "../state";
import {
  IgnoredAction,
  ReductionWithEffect,
  SideEffect,
} from "kamo-reducers/reducers";
import {InputChange} from "kamo-reducers/reducers/inputs";
import {Indexer} from "redux-indexers";
import {findTermInNormalizedNote, StudyDetails, studyDetailsForCloze} from "../study";
import {WorkComplete} from "kamo-reducers/services/workers";
import {loadIndexesWorkerName} from "./session-reducer";
import {sequenceReduction} from "kamo-reducers/services/sequence";
import {startEditingNote, startEditingTerm} from "./edit-note-reducer";
import {Note} from "../storage";
import {VisitSearch} from "./main-menu-reducer";

export interface SelectSearchResult {
  type: "select-search-result",
  result: SearchResult
}

export function selectSearchResult(result: SearchResult): SelectSearchResult {
  return {type: "select-search-result", result};
}

export interface PageSearch {
  type: "page-search",
  dir: number
}

export function pageSearch(dir: number): PageSearch {
  return {
    type: "page-search",
    dir
  }
}


export type SearchAction =
  | InputChange<Inputs>
  | WorkComplete
  | SelectSearchResult
  | VisitSearch
  | PageSearch

const maxSearchResults = 50;

export function reduceSearch(state: State, action: SearchAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | void;

  let needsSearchUpdate = false;

  switch (action.type) {
    case "select-search-result":
      if (action.result[0] === "note") {
        ({state, effect} = sequenceReduction(effect, startEditingNote(state, action.result[1] as Note)))
      } else {
        let details = action.result[1] as StudyDetails;

        let note = Indexer.getFirstMatching(state.indexes.notes.byId, [details.cloze.noteId]);


        if (note) {
          ({state, effect} = sequenceReduction(effect, startEditingNote(state, note)));
          let term = findTermInNormalizedNote(state.editingNoteNormalized, details.cloze.reference, details.cloze.marker);
          if (term) {
            ({state, effect} = sequenceReduction(effect, startEditingTerm(state, term)));
          }
        }
      }
      break;


    case "input-change":
      if (action.target === "searchBar" || action.target === "searchMode") needsSearchUpdate = true;
      break;
    case "work-complete":
      if (action.name[0] === loadIndexesWorkerName) needsSearchUpdate = true;
      break;
    case "page-search":
      state = {...state};
      state.searchPage += action.dir;
    case "visit-search":
      needsSearchUpdate = true;
      break;
  }

  if (needsSearchUpdate) {
    ({state, effect} = sequenceReduction(effect, updateSearchResults(state)));
  }

  return {state, effect};
}

export function updateSearchResults(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void;
  state = {...state};

  const value = state.inputs.searchBar.value;

  const termIter = state.inputs.searchMode.value === "term-new" ?
    state.indexes.clozeAnswers.byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx :
    state.indexes.clozeAnswers.byLanguageAndLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx;


  const clozeAnswerIter = Indexer.reverseIter(termIter,
    [state.inputs.curLanguage.value, Infinity], [state.inputs.curLanguage.value]);
  const noteIter = Indexer.iterator(state.indexes.notes.byLanguage,
    [state.inputs.curLanguage.value], [state.inputs.curLanguage.value, Infinity]);

  const foundNoteIdSet: { [k: string]: boolean } = {};

  const filteredClozeAnswerIter = () => {
    for (let nextClozeAnswer = clozeAnswerIter(); nextClozeAnswer; nextClozeAnswer = clozeAnswerIter()) {
      if (foundNoteIdSet[nextClozeAnswer.noteId]) continue;

      if (state.inputs.searchMode.value == "term" || state.inputs.searchMode.value == "term-new") {
        if (nextClozeAnswer.reference.indexOf(value) === -1) continue;
      }

      const cloze = Indexer.getFirstMatching(state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
        [nextClozeAnswer.noteId, nextClozeAnswer.reference, nextClozeAnswer.marker, nextClozeAnswer.clozeIdx]);
      if (!cloze) continue;
      const details = studyDetailsForCloze(cloze, state.indexes);
      if (!details) continue;

      if (state.inputs.searchMode.value == "content") {
        if (details.content.indexOf(value) === -1) continue;
      }

      foundNoteIdSet[nextClozeAnswer.noteId] = true;
      return details;
    }
  };

  const filteredNoteIter = () => {
    for (let nextNote = noteIter(); nextNote; nextNote = noteIter()) {
      if (foundNoteIdSet[nextNote.id]) continue;
      if (nextNote.attributes.content.indexOf(value) === -1) continue;

      foundNoteIdSet[nextNote.id] = true;

      return nextNote;
    }
  };

  switch (state.inputs.searchMode.value) {
    case "term":
    case "term-new":
    case "content":
      for (let i = 0; i <= state.searchPage; ++i) {
        state.searchResults = [];
        for (let nextDetails = filteredClozeAnswerIter();
             nextDetails && state.searchResults.length < maxSearchResults;
             nextDetails = filteredClozeAnswerIter()) {
          state.searchResults.push(["cloze", nextDetails]);
        }
      }

      state.searchHasMore = !!filteredClozeAnswerIter();
      break;

    case "note":
      for (let i = 0; i <= state.searchPage; ++i) {
        state.searchResults = [];
        for (let nextNote = filteredNoteIter();
             nextNote && state.searchResults.length < maxSearchResults;
             nextNote = filteredNoteIter()) {
          state.searchResults.push(["note", nextNote]);
        }
      }

      state.searchHasMore = !!filteredNoteIter();
      break
  }

  return {state, effect};
}
