import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {ClozeType, LanguageSettings, newNormalizeCloze, NormalizedCloze, NormalizedTerm} from "../model";
import {addNewTerm, findTermInNormalizedNote, findTermRange, getTermFragment} from "../study";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {findVoiceForLanguage, requestSpeech} from "../services/speech";

export interface VisitEditNote {
  type: "visit-edit-note"
}

export const visitEditNote: VisitEditNote = {type: "visit-edit-note"};

export interface ApplyNoteEdits {
  type: "apply-note-edits"
}

export const testPronounciation: TestPronounciation = {type: "test-pronounciation"};

export interface TestPronounciation {
  type: "test-pronounciation"
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

export interface CommitTerm {
  type: "commit-term"
}

export const commitTerm: CommitTerm = {type: "commit-term"};

export interface DeleteTerm {
  type: "delete-term"
}

export const deleteTerm: DeleteTerm = {type: "delete-term"};

export type EditNoteActions = VisitEditNote | ApplyNoteEdits | StartContentEdit |
  ReturnToTermSelect | SelectTermCell | SelectEditTerm | TestPronounciation |
  CommitTerm | DeleteTerm;

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

    case "delete-term":
      state = {...state};
      state.editingNoteMode = "select";

      var editingNote = state.editingNoteNormalized = {...state.editingNoteNormalized};
      var term = findTermInNormalizedNote(editingNote, state.editingTermReference, state.editingTermMarker);
      if (!term)  break;

      let noteAttrs = editingNote.attributes = {...editingNote.attributes};
      var range = findTermRange(term, noteAttrs.content);
      noteAttrs.content = noteAttrs.content.slice(0, range[0]) + term.attributes.reference + noteAttrs.content.slice(range[1]);

      let terms = noteAttrs.terms = noteAttrs.terms.slice();
      terms.splice(terms.indexOf(term), 1);
      break;

    case "commit-term":
      state = {...state};
      state.editingNoteMode = "select";

      var editingNote = state.editingNoteNormalized = {...state.editingNoteNormalized};
      var term = findTermInNormalizedNote(editingNote, state.editingTermReference, state.editingTermMarker);
      if (!term)  break;

      term = {...term};

      let existingIdx = editingNote.attributes.terms.indexOf(term);
      editingNote.attributes = {...editingNote.attributes};
      editingNote.attributes.terms = editingNote.attributes.terms.slice();
      editingNote.attributes.terms.splice(existingIdx, 1, term);


      let termAttrs = term.attributes = {...term.attributes};
      termAttrs.pronounce = state.inputs.termPronounce;
      termAttrs.definition = state.inputs.termDefinition;
      termAttrs.hint = state.inputs.termHint;

      let newClozes = state.toggles.studyByProduce ? state.inputs.termClozes.split(",") : [];
      let produced = termAttrs.clozes.filter(c => c.attributes.type === "produce")

      let next: NormalizedCloze;

      termAttrs.clozes = newClozes.map((clozed, i) => {
        if (i < produced.length) {
          next = {...produced[i]};
        } else {
          next = {...newNormalizeCloze};
        }

        next.attributes = {...next.attributes};
        next.attributes.clozed = clozed;
        return next;
      });

      const addClozeType = (type: ClozeType) => {
        let existing = termAttrs.clozes.filter(c => c.attributes.type === type)[0];
        if (existing) {
          termAttrs.clozes.push(existing);
        } else {
          next = {...newNormalizeCloze};
          next.attributes = {...next.attributes};
          next.attributes.type = type;
          termAttrs.clozes.push(next);
        }
      };

      if (state.toggles.studyBySpeak) {
        addClozeType("speak");
      }

      if (state.toggles.studyByRecognize) {
        addClozeType("recognize");
      }

      if (state.toggles.studyByListen) {
        addClozeType("listen");
      }

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

    case "test-pronounciation":
      let voice = findVoiceForLanguage(state.voices,
        LanguageSettings[state.editingNoteNormalized.attributes.language].codes);

      var term = findTermInNormalizedNote(
        state.editingNoteNormalized,
        state.editingTermReference,
        state.editingTermMarker);

      if (voice && term) {
        let fragment = getTermFragment(
          state.editingNoteNormalized, term,
          term.attributes.pronounce || term.attributes.reference);
        effect = sequence(effect, requestSpeech(voice, fragment));
      }
      break;

    case "select-edit-term":
      ({state, effect} = sequenceReduction(effect, startEditingTerm(state, action.term)));
      break;

    case "select-term-cell":
      state = {...state};

      if (state.selectTermLeft >= 0) {
        if (action.idx > state.selectTermLeft) {
          state.editingNoteNormalized = addNewTerm(state.editingNoteNormalized, state.selectTermLeft, action.idx + 1);
          let terms = state.editingNoteNormalized.attributes.terms;
          let term = terms[terms.length - 1];

          ({state, effect} = sequenceReduction(effect, startEditingTerm(state, term)));
        }

        state.selectTermLeft = -1;
      } else {
        state.selectTermLeft = action.idx
      }
      break;
  }

  return {state, effect};
}

export function startEditingTerm(state: State, term: NormalizedTerm): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state = {...state};

  state.editingTermMarker = term.attributes.marker;
  state.editingTermReference = term.attributes.reference;
  state.editingNoteMode = "term";

  state.inputs = {...state.inputs};
  state.inputs.termHint = term.attributes.hint;
  state.inputs.termPronounce = term.attributes.pronounce;
  state.inputs.termSearchBy = term.attributes.reference;
  state.inputs.termClozes = term.attributes.clozes
      .filter(c => c.attributes.type === "produce")
      .map(c => c.attributes.clozed).join(",") || term.attributes.reference;
  state.inputs.termDefinition = term.attributes.definition;

  state.toggles = {...state.toggles};
  state.toggles.studyByListen = !!term.attributes.clozes.filter(c => c.attributes.type === "listen").length;
  state.toggles.studyByProduce = !!term.attributes.clozes.filter(c => c.attributes.type === "produce").length;
  state.toggles.studyByRecognize = !!term.attributes.clozes.filter(c => c.attributes.type === "recognize").length;
  state.toggles.studyBySpeak = !!term.attributes.clozes.filter(c => c.attributes.type === "speak").length;

  return {state, effect};
}
