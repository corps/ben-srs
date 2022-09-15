import {defaultLanguageSettings} from "../settings";
import {getMimeFromFileName} from "./storage";
import {mapSome, mapSomeAsync, Maybe, some, withDefault} from "../utils/maybe";
import { useEffect, useState } from "react";
import { useTime } from "../hooks/useTime";

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

let lastAudio: HTMLAudioElement = new Audio();
export function playAudio(dataUrl: string, start: number | null | undefined, end: number | null | undefined) {
  lastAudio.pause();
  const audio = new Audio(dataUrl);
  if (start != null) audio.fastSeek(start);


  const timeupdate = () => {
    if (end && audio.currentTime >= end) audio.pause();
  }

  const pause = () => {
    audio.removeEventListener('timeupdate', timeupdate);
    audio.removeEventListener('pause', pause);
  }
  
  audio.addEventListener('timeupdate', timeupdate);
  audio.addEventListener('pause', pause);

  lastAudio = audio;
  audio.play().catch(e => alert(e));
}

export function usePlayTime() {
  const [time, setTime] = useState(0);
  useTime(1000);

  useEffect(() => {
    const timeupdate = () => {
      setTime(lastAudio.currentTime);
    }
    
    lastAudio.addEventListener('timeupdate', timeupdate);

    return () => {
      lastAudio.removeEventListener('timeupdate', timeupdate);
    }
  }, [lastAudio]);

  return time;
}
