import {State, Toggles} from "../state";
import {
  IgnoredAction,
  ReductionWithEffect,
  SideEffect,
} from "kamo-reducers/reducers";
import {minutesOfTime} from "../utils/time";
import {findNextStudyDetails, findTermInNormalizedNote} from "../study";
import {requestTick, UpdateTime} from "kamo-reducers/services/time";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {Toggle} from "kamo-reducers/reducers/toggle";
import {requestTermSpeech} from "../services/note-speech";
import {Answer, scheduledBy} from "../scheduler";
import {startEditingNote, startEditingTerm} from "./edit-note-reducer";
import {Indexer} from "redux-indexers";
import {
  denormalizedNote,
  findNoteTree,
  loadIndexables,
  normalizedNote,
} from "../indexes";
import {requestLocalStoreUpdate} from "./session-reducer";
import {startSync} from "./sync-reducer";
import {ClozeType} from "../model";

export interface ReadCard {
  type: "read-card";
}

export const readCard: ReadCard = {type: "read-card"};

export interface AnswerCard {
  type: "answer-card";
  answer: Answer;
}

export function answerCard(answer: Answer): AnswerCard {
  return {
    type: "answer-card",
    answer,
  };
}

export interface EditCard {
  type: "edit-card";
}

export const editCard: EditCard = {
  type: "edit-card",
};

export type StudyActions = ReadCard | AnswerCard | EditCard;

export function reduceStudy(state: State,
                            action: StudyActions | UpdateTime | IgnoredAction | Toggle<Toggles>): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  let cloze = state.studyDetails && state.studyDetails.cloze;

  switch (action.type) {
    case "update-time":
      if (state.location !== "study") break;
      effect = sequence(effect, requestTick(1000 - state.now % 1000));
      break;

    case "read-card":
      effect = sequence(
        effect,
        requestTermSpeech(
          state,
          state.studyDetails.audioFileId,
          cloze.language,
          state.studyDetails.spoken
        )
      );
      break;

    case "answer-card":
      ({state, effect} = sequenceReduction(effect, answerCurrentCard(state, action.answer)));
      break;

    case "edit-card":
      ({state, effect} = sequenceReduction(
        effect,
        startEditingCurrentStudy(state)
      ));
      break;
  }

  return {state, effect};
}

export function startEditingCurrentStudy(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void;
  state = {...state};

  let cloze = state.studyDetails && state.studyDetails.cloze;

  var note = Indexer.getFirstMatching(state.indexes.notes.byId, [
    cloze.noteId,
  ]);

  var tree = note && findNoteTree(state.indexes, note.id);
  if (note && tree) {
    let term = findTermInNormalizedNote(
      normalizedNote(tree),
      cloze.reference,
      cloze.marker
    );

    if (term) {
      ({state, effect} = sequenceReduction(
        effect,
        startEditingNote(state, note)
      ));
      ({state, effect} = sequenceReduction(
        effect,
        startEditingTerm(state, term)
      ));
    }
  }

  return {state, effect};
}

export function answerCurrentCard(state: State, answer: Answer): ReductionWithEffect<State> {
  let effect: SideEffect | void;

  state = {...state};
  let cloze = state.studyDetails && state.studyDetails.cloze;
  let schedule = scheduledBy(cloze.attributes.schedule, answer);
  var tree = findNoteTree(state.indexes, cloze.noteId);

  if (tree) {
    let normalized = normalizedNote(tree);
    let term = findTermInNormalizedNote(
      normalized,
      cloze.reference,
      cloze.marker
    );

    if (term && term.attributes.clozes.length > cloze.clozeIdx) {
      let termIdx = normalized.attributes.terms.indexOf(term);
      term = {...term};

      normalized = {...normalized};
      normalized.attributes = {...normalized.attributes};
      normalized.attributes.terms = normalized.attributes.terms.slice();
      normalized.attributes.terms.splice(termIdx, 1, term);

      term.attributes = {...term.attributes};
      term.attributes.clozes = term.attributes.clozes.slice();
      let updatingCloze = term.attributes.clozes[cloze.clozeIdx];
      updatingCloze = term.attributes.clozes[cloze.clozeIdx] = {
        ...updatingCloze,
      };
      updatingCloze.attributes = {...updatingCloze.attributes};
      updatingCloze.attributes.schedule = schedule;
      updatingCloze.attributes.answers = updatingCloze.attributes.answers.concat(
        [answer]
      );

      let denormalized = denormalizedNote(
        normalized,
        tree.note.id,
        tree.note.path,
        tree.note.version
      );
      denormalized.note = {...denormalized.note};
      denormalized.note.localEdits = true;

      state.indexes = loadIndexables(state.indexes, [denormalized]);
      effect = sequence(effect, requestLocalStoreUpdate(state));
      ({state, effect} = sequenceReduction(effect, startSync(state)));
    }
  }

  ({state, effect} = sequenceReduction(
    effect,
    startStudyingNextCard(state)
  ));

  return {state, effect};
}

export function startStudyingNextCard(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  let studyDetails = findNextStudyDetails(
    state.inputs.curLanguage.value,
    minutesOfTime(state.now),
    state.indexes,
    state.toggles.studySpoken
  );
  if (studyDetails) {
    state.studyDetails = studyDetails;
    state.toggles = {...state.toggles};
    state.toggles.showBack = false;
    state.location = "study";
    state.studyStarted = state.now;

    effect = sequence(effect, requestTick(0));
  }

  return {state, effect};
}

export function answerOk(state: State): Answer {
  const timeToAnswer = state.now - state.studyStarted;
  return [minutesOfTime(state.now), ["f", okAnswerFactor(timeToAnswer, state.studyDetails.type)]];
}

export function answerMiss(state: State): Answer {
  return [minutesOfTime(state.now), ["f", 0.6]];
}

export function answerSkip(state: State): Answer {
  return [minutesOfTime(state.now), ["d", 60]];
}

function okAnswerFactor(timeToAnswer: number, type: ClozeType) {
  switch (type) {
    case "produce":
      return timeToAnswer < 6 ? 3.0 : 2.4;

    case "recognize":
      return timeToAnswer <= 4 ? 3.6 : 2.8;

    case "listen":
      return timeToAnswer < 10 ? 3.6 : 2.8;

    case "speak":
      return timeToAnswer < 10 ? 3.6 : 2.8;
  }
}
