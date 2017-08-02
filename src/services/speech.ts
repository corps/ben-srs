import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {GlobalAction, IgnoredSideEffect, SideEffect} from "kamo-reducers/reducers";

export interface SpeechVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly localService: boolean;
  readonly name: string;
  readonly voiceURI: string;
}

export interface LoadVoices {
  type: "load-voices"
  voices: SpeechVoice[]
}

export function loadVoices(voices: SpeechVoice[]): LoadVoices {
  return {
    type: "load-voices",
    voices
  }
}

export interface RequestSpeech {
  effectType: "request-speech",
  voice: SpeechVoice,
  text: string
}

export function requestSpeech(voice: SpeechVoice, text: string): RequestSpeech {
  return {
    effectType: "request-speech",
    voice, text
  }
}

export function withSpeech(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      let checkVoices = () => {
        let voices = speechSynthesis.getVoices();
        if (voices.length) {
          clearInterval(checkVoicesInterval);

          // Copy the data
          voices = voices.map(v => {
            let {lang, localService, name, voiceURI} = v;
            return {default: v.default, lang, localService, name, voiceURI};
          });

          dispatch(loadVoices(voices));
        }
      };

      let checkVoicesInterval = setInterval(checkVoices, 1000);
      checkVoices();

      subscription.add(() => {
        clearInterval(checkVoicesInterval);
      });

      subscription.add(effect$.subscribe((effect: RequestSpeech | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-speech":
            speechSynthesis.cancel();
            let utterance = new SpeechSynthesisUtterance();
            utterance.text = effect.text;
            // utterance.voice = effect.voice;
            // IOS
            (utterance as any).voiceURI = effect.voice.voiceURI;
            utterance.lang = effect.voice.lang;

            speechSynthesis.speak(utterance);
        }
      }));

      return subscription.unsubscribe;
    }
  }
}

export function findVoiceForLanguage(voices: SpeechVoice[], codes: string[]): SpeechVoice | 0 {
  for (let code of codes) {
    for (let voice of voices) {
      if (voice.lang === code) return voice;
    }
  }

  return null;
}