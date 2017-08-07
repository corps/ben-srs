import {reduceTime, UpdateTime} from "kamo-reducers/services/time";
import {State} from "./state";
import {computedFor, reducerChain, ReductionWithEffect} from "kamo-reducers/reducers";
import {reduceLogin, LoginAction} from "./reducers/login-reducer";
import {NavigationAction} from "kamo-reducers/services/navigation";
import {reduceLocalStore} from "./reducers/local-store-reducer";
import {reduceAwaiting} from "./reducers/awaiting-reducer";
import {reduceSync} from "./reducers/sync-reducer";
import {
  computeEndOfMonth, computeStartOfDay, computeStartOfMonth, computeStartOfWeek, computeEndOfWeek,
  computeEndOfDay
} from "./reducers/time-computed";
import {computeStudyData} from "./reducers/study-data-computed";
import {reduceRouting} from "./router";

export type Action = UpdateTime | LoginAction | NavigationAction;

const computedProperty = computedFor<State>();

export function reducer(state: State, action: Action): ReductionWithEffect<State> {
  return reducerChain(state, action)
    .apply(reduceTime)
    .apply(reduceAwaiting)
    .apply(reduceLogin)
    .apply(reduceLocalStore)
    .apply(reduceSync)
    .apply(reduceRouting)
    .apply(computedProperty("startOfDayMinutes", computeStartOfDay))
    .apply(computedProperty("startOfWeekMinutes", computeStartOfWeek))
    .apply(computedProperty("startOfMonthMinutes", computeStartOfMonth))
    .apply(computedProperty("endOfDayMinutes", computeEndOfDay))
    .apply(computedProperty("endOfWeekMinutes", computeEndOfWeek))
    .apply(computedProperty("endOfMonthMinutes", computeEndOfMonth))
    .apply(computedProperty("studyData", computeStudyData))
    .result();
}
