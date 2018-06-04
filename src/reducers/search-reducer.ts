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
import {Note} from "../model";
import {VisitSearch} from "./main-menu-reducer";

export interface SelectSearchResult {
  type: "select-search-result",
  result: SearchResult
}

export function selectSearchResult(result: SearchResult): SelectSearchResult {
  return {type: "select-search-result", result};
}


export type SearchAction =
  | InputChange<Inputs>
  | WorkComplete
  | SelectSearchResult
  | VisitSearch

const maxSearchResults = 150;

export function reduceSearch(state: State, action: SearchAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | void;

  if (action.type === "select-search-result") {
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

    return {state, effect};
  }

  if (action.type === "visit-search") {
  } else if (action.type === "input-change") {
    if (action.target !== "searchBar" && action.target !== "searchMode") return {state, effect};
  } else if (action.type === "work-complete") {
    if (action.name[0] !== loadIndexesWorkerName) return {state, effect};
  } else {
    return {state, effect};
  }

  state = {...state};

  const value = state.inputs.searchBar.value;
  state.searchResults = [];

  const clozeAnswerIter = Indexer.reverseIter(state.indexes.clozeAnswers.byLanguageAndLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx,
    [state.inputs.curLanguage.value, Infinity], [state.inputs.curLanguage.value]);
  const noteIter = Indexer.iterator(state.indexes.notes.byLanguage,
    [state.inputs.curLanguage.value], [state.inputs.curLanguage.value, Infinity]);

  const foundNoteIdSet: { [k: string]: boolean } = {};
  const foundTermSet: { [k: string]: boolean } = {};

  switch (state.inputs.searchMode.value) {
    case "term":
    case "content":
      for (let nextClozeAnswer = clozeAnswerIter();
           nextClozeAnswer && state.searchResults.length < maxSearchResults;
           nextClozeAnswer = clozeAnswerIter()) {
        const termName = nextClozeAnswer.reference + "-" + nextClozeAnswer.marker;
        if (foundTermSet[termName]) continue;

        if (state.inputs.searchMode.value == "term") {
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

        foundTermSet[termName] = true;
        state.searchResults.push(["cloze", details]);
      }

      break;
    case "note":
      for (let nextNote = noteIter();
           nextNote && state.searchResults.length < maxSearchResults;
           nextNote = noteIter()) {
        if (foundNoteIdSet[nextNote.id]) continue;
        if (nextNote.attributes.content.indexOf(value) === -1) continue;

        foundNoteIdSet[nextNote.id] = true;
        state.searchResults.push(["note", nextNote]);
      }
      break
  }

  return {state, effect};
}
