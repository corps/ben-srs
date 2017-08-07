import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";

export interface VisitStudy {
  type: "visit-study"
}

export const visitStudy: VisitStudy = {type: "visit-study"};

export type StudyActions = VisitStudy;

export function reduceStudy(state: State, action: StudyActions | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "visit-study":
      state = {...state};
      state.location = "study";
      break;
  }

  return {state, effect};
}