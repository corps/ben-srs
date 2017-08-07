import {reduceTime, UpdateTime} from "kamo-reducers/services/time";
import {State} from "./state";
import {computedFor, reducerChain, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {NavigationAction} from "kamo-reducers/services/navigation";
import {reduceSession, SessionActions} from "./reducers/session-reducer";
import {reduceAwaiting} from "./reducers/awaiting-reducer";
import {reduceSync} from "./reducers/sync-reducer";
import {
  computeEndOfMonth, computeStartOfDay, computeStartOfMonth, computeStartOfWeek, computeEndOfWeek,
  computeEndOfDay
} from "./reducers/time-computed";
import {computeStudyData} from "./reducers/study-data-computed";
import {reduceRouting} from "./router";
import {reduceTick} from "./reducers/ticker-reducer";
import {computeCurLanguageDefault, computeLanguages} from "./reducers/languages-computed";

export type Action = UpdateTime | NavigationAction | SessionActions;

const computedProperty = computedFor<State>();

export function reducer(state: State, action: Action): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  ({state, effect} = reducerChain(state, action)
    .apply(reduceTime)
    .apply(reduceTick)
    .apply(reduceAwaiting)
    .apply(reduceSession)
    .apply(reduceSync)
    .apply(reduceRouting)
    .apply(computedProperty("startOfDayMinutes", computeStartOfDay))
    .apply(computedProperty("startOfWeekMinutes", computeStartOfWeek))
    .apply(computedProperty("startOfMonthMinutes", computeStartOfMonth))
    .apply(computedProperty("endOfDayMinutes", computeEndOfDay))
    .apply(computedProperty("endOfWeekMinutes", computeEndOfWeek))
    .apply(computedProperty("endOfMonthMinutes", computeEndOfMonth))
    .apply(computedProperty("studyData", computeStudyData))
    .apply(computedProperty("languages", computeLanguages))
    .result());

  let curLanguage = computeCurLanguageDefault(state);
  if (curLanguage !== state.inputs.curLanguage) {
    state = {...state};
    state.inputs = {...state.inputs};
    state.inputs.curLanguage = curLanguage;
  }

  return {state, effect}
}
