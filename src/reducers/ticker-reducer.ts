import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {requestTick, UpdateTime} from "kamo-reducers/services/time";
import {Initialization} from "../services/initialization";
import {sequence} from "kamo-reducers/services/sequence";

export function reduceTick(state: State, action: UpdateTime | Initialization | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
      effect = sequence(effect, requestTick(15000));
      break;

    case "update-time":
      effect = sequence(effect, requestTick(state.now % 15000));
      break;
  }

  return {state, effect};
}