import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {NormalizedTerm} from "../model";
import {addNewTerm} from "../study";
import {sequenceReduction} from "kamo-reducers/services/sequence";

export interface VisitEditNote {
  type: "visit-edit-note"
}

export const visitEditNote: VisitEditNote = {type: "visit-edit-note"};

export interface ApplyNoteEdits {
  type: "apply-note-edits"
}

export const applyNoteEdits: ApplyNoteEdits = {type: "apply-note-edits"};

export interface StartContentEdit {
  type: "start-content-edit"
}

export const startContentEdit: StartContentEdit = {type: "start-content-edit"};

export interface ReturnToTermSelect {
  type: "return-to-term-select"
}

export const returnToTermSelect: ReturnToTermSelect = {type: "return-to-term-select"};

export interface SelectTermCell {
  type: "select-term-cell",
  idx: number
}

export function selectTermCell(idx: number): SelectTermCell {
  return {
    type: "select-term-cell",
    idx
  }
}

export interface SelectEditTerm {
  type: "select-edit-term",
  term: NormalizedTerm
}

export function selectEditTerm(term: NormalizedTerm): SelectEditTerm {
  return {
    type: "select-edit-term",
    term
  }
}

export type EditNoteActions = VisitEditNote | ApplyNoteEdits | StartContentEdit |
  ReturnToTermSelect | SelectTermCell | SelectEditTerm;

export function reduceEditNote(state: State, action: EditNoteActions | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  let content = state.editingNoteNormalized.attributes.content;

  switch (action.type) {
    case "visit-edit-note":
      state = {...state};
      state.location = "edit-note";
      break;

    case "return-to-term-select":
      state = {...state};
      state.editingNoteMode = "select";
      break;

    case "apply-note-edits":
      state = {...state};
      state.editingNoteMode = "select";
      state.editingNoteNormalized = {...state.editingNoteNormalized};
      state.editingNoteNormalized.attributes = {...state.editingNoteNormalized.attributes};
      state.editingNoteNormalized.attributes.content = state.inputs.editingNoteContent;
      state.editingNoteNormalized.attributes.language = state.inputs.editingNoteLanguage;
      break;

    case "start-content-edit":
      state = {...state};
      state.inputs = {...state.inputs};
      state.editingNoteMode = "content";
      state.inputs.editingNoteContent = content;
      state.inputs.editingNoteLanguage = state.editingNoteNormalized.attributes.language;
      break;

    case "select-term-cell":
      state = {...state};

      if (state.selectTermLeft >= 0) {
        if (action.idx <= state.selectTermLeft) {
          state.selectTermLeft = -1;
        } else {
          state.editingNoteNormalized = addNewTerm(state.editingNoteNormalized, state.selectTermLeft, action.idx + 1);
          let terms = state.editingNoteNormalized.attributes.terms;
          let term = terms[terms.length - 1];

          ({state, effect} = sequenceReduction(effect, startEditingTerm(state, term)));
        }
      } else {
        state.selectTermLeft = action.idx
      }
      break;
  }

  return {state, effect};
}

export function startEditingTerm(state: State, term: NormalizedTerm): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state.editingTermMarker = term.attributes.marker;
  state.editingTermReference = term.attributes.reference;
  state.editingNoteMode = "term";

  state.inputs = {...state.inputs};
  state.inputs.termHint = term.attributes.hint;
  state.inputs.termPronounce = term.attributes.pronounce;
  state.inputs.termSearchBy = term.attributes.reference;
  state.inputs.termClozes = term.attributes.clozes.filter(c => c.attributes.type === "produce").join(",");
  state.inputs.termDefinition = term.attributes.definition;

  state.toggles = {...state.toggles};
  state.toggles.studyByListen = !!term.attributes.clozes.filter(c => c.attributes.type === "listen").length;
  state.toggles.studyByProduce = !!state.inputs.termClozes.length;
  state.toggles.studyByRecognize = !!term.attributes.clozes.filter(c => c.attributes.type === "recognize").length;
  state.toggles.studyBySpeak = !!term.attributes.clozes.filter(c => c.attributes.type === "speak").length;

  return {state, effect};
}
