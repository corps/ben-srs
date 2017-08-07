import {ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {Action} from "../reducer";
import {State} from "../state";

export function reduceKeypresses(state: State, action: Action): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "keypress":
      break;
  }


  return {state, effect};
}