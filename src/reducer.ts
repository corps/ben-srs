import {reduceTime, UpdateTime} from "kamo-reducers/services/time";
import {State} from "./state";
import {reducerChain, ReductionWithEffect} from "kamo-reducers/reducers";
import {reduceUser, LoginAction} from "./reducers/login-reducer";
import {NavigationAction} from "kamo-reducers/services/navigation";

export type Action = UpdateTime | LoginAction | NavigationAction;

export function reducer(state: State, action: Action): ReductionWithEffect<State> {
  return reducerChain({state}, action)
    .apply(reduceTime)
    .apply(reduceUser)
    .finish();
}
