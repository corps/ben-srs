import {UpdateTime} from "kamo-reducers/services/time";
import {State} from "./state";
import {ReductionWithEffect} from "kamo-reducers/reducers";

export type Action = UpdateTime;

export function reducer(state: State, action: Action): ReductionWithEffect<State> {
  return {state};
}
