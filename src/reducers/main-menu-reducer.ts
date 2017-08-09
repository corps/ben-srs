import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {startEditingNote} from "./edit-note-reducer";
import {findNextEditableNote} from "../study";
import {sequenceReduction} from "kamo-reducers/services/sequence";
import {startStudyingNextCard} from "./study-reducer";

export interface VisitMainMenu {
  type: "visit-main-menu"
}

export const visitMainMenu: VisitMainMenu = {type: "visit-main-menu"};

export interface VisitEditNote {
  type: "visit-edit-note"
}

export const visitEditNote: VisitEditNote = {type: "visit-edit-note"};

export interface VisitStudy {
  type: "visit-study"
  when: number
}

export function visitStudy(when = Date.now()): VisitStudy {
  return {
    type: "visit-study",
    when
  };
}


export type MainMenuActions = VisitMainMenu | VisitEditNote | VisitStudy;

export function reduceMainMenu(state: State, action: MainMenuActions | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "visit-main-menu":
      state = {...state};
      state.location = "main";
      break;

    case "visit-edit-note":
      let note = findNextEditableNote(state.indexes);
      if (note) {
        ({state, effect} = sequenceReduction(effect, startEditingNote(state, note)));
      }
      break;

    case "visit-study":
      state = {...state};
      state.now = action.when;

      ({state, effect} = sequenceReduction(effect, startStudyingNextCard(state)))
      break;
  }

  return {state, effect};
}