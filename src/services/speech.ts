import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {GlobalAction, IgnoredSideEffect, SideEffect} from "kamo-reducers/reducers";
import {Language, LanguageSettings} from "../model";

export interface SpeechVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly localService: boolean;
  readonly name: string;
  readonly voiceURI: string;
}

export interface RequestSpeech {
  effectType: "request-speech",
  language: Language,
  text: string
}

export function requestSpeech(text: string, language: Language): RequestSpeech {
  return {
    effectType: "request-speech",
    language, text
  }
}

export function withSpeech(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      subscription.add(effect$.subscribe((effect: RequestSpeech | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-speech":
            speechSynthesis.cancel();

            let utterance = new SpeechSynthesisUtterance();
            utterance.text = effect.text;

            for (let code of LanguageSettings[effect.language].codes) {
              for (let voice of speechSynthesis.getVoices()) {
                if (voice.lang === code || voice.lang.replace(/-/g, "_") === code) {
                  utterance.voice = voice;
                  (utterance as any).voiceURI = voice.voiceURI;
                }
              }
            }

            if (!utterance.voice) {
              utterance.lang = LanguageSettings[effect.language].codes[0];
            }

            speechSynthesis.speak(utterance);
        }
      }));

      return subscription.unsubscribe;
    }
  }
}

