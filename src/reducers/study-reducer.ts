import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {minutesOfTime} from "../utils/time";
import {findNextStudyDetails} from "../study";
import {requestTick, UpdateTime} from "kamo-reducers/services/time";
import {sequence} from "kamo-reducers/services/sequence";


export interface FlipCard {
  type: "flip-card",
}

export const flipCard: FlipCard = {type: "flip-card"};

export type StudyActions = FlipCard;

export function reduceStudy(state: State, action: StudyActions | UpdateTime | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "update-time":
      if (state.location === "study" && !state.toggles.showBack)
        effect = sequence(effect, requestTick(1000 - (state.now % 1000)));
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