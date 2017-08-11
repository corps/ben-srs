import {State, Toggles} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {minutesOfTime} from "../utils/time";
import {findNextStudyDetails} from "../study";
import {requestTick, UpdateTime} from "kamo-reducers/services/time";
import {sequence} from "kamo-reducers/services/sequence";
import {Toggle} from "kamo-reducers/reducers/toggle";
import {findVoiceForLanguage, requestSpeech} from "../services/speech";
import {LanguageSettings} from "../model";

export interface ReadCard {
  type: "read-card"
}

export const readCard: ReadCard = {type: "read-card"};

export type StudyActions = ReadCard;

export function reduceStudy(state: State, action: StudyActions | UpdateTime | IgnoredAction | Toggle<Toggles>): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "update-time":
      if (state.location !== "study") break;
      effect = sequence(effect, requestTick(1000 - (state.now % 1000)));
      break;

    case "read-card":
      let voice = findVoiceForLanguage(state.voices, LanguageSettings[state.studyDetails.cloze.language].codes);
      if (voice) {
        effect = sequence(effect, requestSpeech(voice, state.studyDetails.spoken));
      }
      break;
  }

  return {state, effect};
}

export function startStudyingNextCard(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  let studyDetails = findNextStudyDetails(state.inputs.curLanguage, minutesOfTime(state.now), state.indexes);
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