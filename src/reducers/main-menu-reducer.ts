import {State} from "../state";
import {
  IgnoredAction,
  ReductionWithEffect,
  SideEffect,
} from "kamo-reducers/reducers";
import {startEditingNote} from "./edit-note-reducer";
import {findNextEditableNote} from "../study";
import {sequenceReduction} from "kamo-reducers/services/sequence";
import {startStudyingNextCard} from "./study-reducer";
import {Indexer} from "redux-indexers";
import {minutesOfTime} from "../utils/time";

export interface VisitMainMenu {
  type: "visit-main-menu";
}


export const visitMainMenu: VisitMainMenu = {type: "visit-main-menu"};

export interface VisitSearch {
  type: "visit-search";
}

export const visitSearch: VisitSearch = {type: "visit-search"};

export interface VisitEditNote {
  type: "visit-edit-note";
}

export const visitEditNote: VisitEditNote = {type: "visit-edit-note"};

export interface VisitStudy {
  type: "visit-study";
}

export const visitStudy: VisitStudy = {
  type: "visit-study",
};

export type MainMenuActions = VisitMainMenu | VisitEditNote | VisitStudy | VisitSearch;

export function reduceMainMenu(
  state: State,
  action: MainMenuActions | IgnoredAction
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "visit-main-menu":
      state = {...state};
      state.location = "main";
      ({state, effect} = sequenceReduction(effect, optimizeSelectedLanguage(state)));
      break;

    case "visit-search":
      state = {...state};
      state.location = "search";
      break;

    case "visit-edit-note":
      let note = findNextEditableNote(state.indexes);
      if (note) {
        ({state, effect} = sequenceReduction(
          effect,
          startEditingNote(state, note)
        ));
      }
      break;

    case "visit-study":
      state = {...state};

      ({state, effect} = sequenceReduction(
        effect,
        startStudyingNextCard(state)
      ));
      break;
  }

  return {state, effect};
}

export function optimizeSelectedLanguage(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  let nextDue = Indexer.iterator(state.indexes.clozes.byLanguageSpokenAndNextDue, [state.inputs.curLanguage, state.toggles.studySpoken])();

  let minutesNow = minutesOfTime(state.now);
  let curLanguageHasDue = nextDue && nextDue.attributes.schedule.nextDueMinutes <= minutesNow;

  if (!curLanguageHasDue) {
    nextDue = Indexer.reverseIter(state.indexes.clozes.byNextDue, [minutesNow], [null])();
    nextDue = nextDue || Indexer.iterator(state.indexes.clozes.byNextDue)();
    
    if (nextDue) {
      let language = nextDue.language;
      let spoken = nextDue.attributes.type == "listen" || nextDue.attributes.type == "speak";

      state = {...state};
      state.inputs = {...state.inputs};
      state.inputs.curLanguage = { value: language };

      state.toggles = {...state.toggles};
      state.toggles.studySpoken = spoken;
    }
  }

  return {state, effect};
}
