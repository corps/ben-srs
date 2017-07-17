import {reduceTime, UpdateTime} from "kamo-reducers/services/time";
import {State} from "./state";
import {reducerChain, ReductionWithEffect} from "kamo-reducers/reducers";
import {reduceLogin, LoginAction} from "./reducers/login-reducer";
import {NavigationAction} from "kamo-reducers/services/navigation";
import {reduceLocalStore} from "./reducers/local-store-reducer";
import {reduceAwaiting} from "./reducers/awaiting-reducer";
import {reduceSync} from "./reducers/sync-reducer";

export type Action = UpdateTime | LoginAction | NavigationAction;

export function reducer(state: State, action: Action): ReductionWithEffect<State> {
  return reducerChain(state, action)
    .apply(reduceTime)
    .apply(reduceAwaiting)
    .apply(reduceLogin)
    .apply(reduceLocalStore)
    .apply(reduceSync)
    .result();
}
