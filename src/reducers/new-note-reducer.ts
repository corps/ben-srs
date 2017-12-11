import {State} from "../state";
import {
  IgnoredAction,
  ReductionWithEffect,
  SideEffect,
} from "kamo-reducers/reducers";
import uuid = require("uuid");
import {newNormalizedNote} from "../model";
import {sequenceReduction, sequence} from "kamo-reducers/services/sequence";
import {startSync} from "./sync-reducer";
import {Language} from "../model";
import {requestTermSpeech} from "../services/note-speech";

export interface VisitNewNote {
  type: "visit-new-note";
}

export const visitNewNote: VisitNewNote = {type: "visit-new-note"};

export interface ClickAddNewNote {
  type: "click-add-new-note";
}

export const clickAddNewNote: ClickAddNewNote = {type: "click-add-new-note"};

export interface TestNewNoteAudioFile {
  type: "test-new-note-audio-file";
}

export const testNewNoteAudioFile: TestNewNoteAudioFile = {
  type: "test-new-note-audio-file",
};

export type NewNoteActions =
  | VisitNewNote
  | ClickAddNewNote
  | TestNewNoteAudioFile;

export function reduceNewNote(
  state: State,
  action: NewNoteActions | IgnoredAction
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "visit-new-note":
      state = {...state};
      state.location = "new-note";
      state.inputs = {...state.inputs};
      state.inputs.newNoteLanguage = {value: ""};
      state.inputs.newNoteContent = {value: ""};
      state.inputs.newNoteAudioId = {value: ""};
      break;

    case "test-new-note-audio-file":
      effect = sequence(
        effect,
        requestTermSpeech(
          state,
          state.inputs.newNoteAudioId.value,
          state.inputs.newNoteLanguage.value as any,
          state.inputs.newNoteContent.value
        )
      );
      break;

    case "click-add-new-note":
      state = {...state};
      state.newNotes = {...state.newNotes};
      let newNote = (state.newNotes["/" + uuid.v4() + ".txt"] = {
        ...newNormalizedNote,
      });
      newNote.attributes = {...newNote.attributes};
      newNote.attributes.content = state.inputs.newNoteContent.value;
      newNote.attributes.language = state.inputs.newNoteLanguage
        .value as Language;

      if (state.inputs.newNoteAudioId.value) {
        newNote.attributes.audioFileId = state.inputs.newNoteAudioId.value;
      }

      ({state, effect} = sequenceReduction(effect, startSync(state)));
      state.location = "main";
  }

  return {state, effect};
}
