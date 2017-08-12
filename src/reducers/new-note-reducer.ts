import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import uuid = require("uuid");
import {newNormalizedNote} from "../model";
import {sequenceReduction} from "kamo-reducers/services/sequence";
import {startSync} from "./sync-reducer";

export interface VisitNewNote {
  type: "visit-new-note"
}

export const visitNewNote: VisitNewNote = {type: "visit-new-note"};

export interface ClickAddNewNote {
  type: "click-add-new-note"
}

export const clickAddNewNote: ClickAddNewNote = {type: "click-add-new-note"};

export type NewNoteActions = VisitNewNote | ClickAddNewNote;

export function reduceNewNote(state: State, action: NewNoteActions | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "visit-new-note":
      state = {...state};
      state.location = "new-note";
      state.inputs = {...state.inputs};
      state.inputs.newNoteLanguage = "" as any;
      state.inputs.newNoteContent = "";
      break;

    case "click-add-new-note":
      state = {...state};
      state.newNotes = {...state.newNotes};
      let newNote = state.newNotes["/" + uuid.v4() + ".txt"] = {...newNormalizedNote};
      newNote.attributes = {...newNote.attributes};
      newNote.attributes.content = state.inputs.newNoteContent;
      newNote.attributes.language = state.inputs.newNoteLanguage;

      ({state, effect} = sequenceReduction(effect, startSync(state)));
      state.location = "main";
  }

  return {state, effect};
}