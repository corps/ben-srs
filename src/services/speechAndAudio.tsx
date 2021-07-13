import {defaultLanguageSettings} from "../settings";
import {getMimeFromFileName} from "./storage";
import {mapSome, mapSomeAsync, Maybe, some} from "../utils/maybe";

export function speak(language: string, text: string) {
  speechSynthesis.cancel();

  let utterance = new SpeechSynthesisUtterance();
  utterance.text = text;

  for (let code of defaultLanguageSettings[language].codes) {
    for (let voice of speechSynthesis.getVoices()) {
      if (voice.lang === code || voice.lang.replace(/-/g, "_") === code) {
        utterance.voice = voice;
        (utterance as any).voiceURI = voice.voiceURI;
      }
    }
  }

  if (!utterance.voice) {
    utterance.lang = defaultLanguageSettings[language].codes[0];
  }

  speechSynthesis.speak(utterance);
}

let lastAudio: Maybe<HTMLAudioElement> = null;
export function playAudio(dataUrl: string) {
  alert(dataUrl);
  mapSome(lastAudio, lastAudio => lastAudio.pause());
  const audio = new Audio(dataUrl);
  lastAudio = some(audio);
  audio.play().catch(e => alert(e));
}