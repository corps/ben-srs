import {ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {Action} from "../reducer";
import {State} from "../state";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {answerCurrentCard, answerMiss, answerOk, answerSkip, startEditingCurrentStudy} from "./study-reducer";
import {requestTermSpeech} from "../services/note-speech";

export function reduceKeypresses(state: State,
                                 action: Action): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "keypress":
      if (action.key === "f" && state.location === "study") {
        state = {...state};
        state.toggles = {...state.toggles};
        state.toggles.showBack = !state.toggles.showBack;
      }

      if (action.key === "a" && state.location === "study") {
        ({state, effect} = sequenceReduction(effect, answerCurrentCard(state, answerOk(state))))
      }

      if (action.key === "s" && state.location === "study") {
        ({state, effect} = sequenceReduction(effect, answerCurrentCard(state, answerMiss(state))))
      }

      if (action.key === "d" && state.location === "study") {
        ({state, effect} = sequenceReduction(effect, answerCurrentCard(state, answerSkip(state))))
      }

      if (action.key === "e" && state.location === "study") {
        ({state, effect} = sequenceReduction(effect, startEditingCurrentStudy(state)))
      }

      if (action.key === "j" && state.location === "study") {
        let cloze = state.studyDetails && state.studyDetails.cloze;

        effect = sequence(
          effect,
          requestTermSpeech(
            state,
            state.studyDetails.audioFileId,
            cloze.language,
            state.studyDetails.spoken
          )
        );
      }

      break;
  }

  return {state, effect};
}
