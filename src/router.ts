import {State} from "./state";
import {navigationReducer, PathLocation} from "kamo-reducers/services/navigation";
import {ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";

export function router(state: State, location: PathLocation): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state = {...state};
  state.now = Date.now();

  let pathParts = location.pathname.split("/");
  if (pathParts.length == 0) pathParts = [""];

  state.pathParts = pathParts;

  return {state, effect};
}

export const reduceRouting = navigationReducer(router);