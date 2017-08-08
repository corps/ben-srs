import {LoadVoices} from "../services/speech";
import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";

export function reduceSpeech(state: State, action: LoadVoices | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "load-voices":
      state = {...state};
      state.voices = action.voices;
  }

  return {state, effect};
}