import {ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {Action} from "../reducer";
import {State} from "../state";

export function reduceKeypresses(state: State, action: Action): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "keypress":
      if (action.key === "f" && state.location === "study") {
        state = {...state};
        state.toggles = {...state.toggles};
        state.toggles.showBack = !state.toggles.showBack;
      }
      break;
  }


  return {state, effect};
}