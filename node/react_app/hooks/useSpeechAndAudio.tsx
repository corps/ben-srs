import { useCallback, useEffect, useState } from 'react';

export const defaultLanguageSettings: { [k: string]: { codes: string[] } } = {
  Japanese: {
    codes: ['ja-JP']
  },
  Cantonese: {
    codes: ['yue-Hant-HK', 'zh-HK']
  },
  English: {
    codes: ['en-US']
  }
};

export function speak(language: string, text: string) {
  speechSynthesis.cancel();

  let utterance = new SpeechSynthesisUtterance();
  utterance.text = text;

  for (let code of defaultLanguageSettings[language].codes) {
    for (let voice of speechSynthesis.getVoices()) {
      if (voice.lang === code || voice.lang.replace(/-/g, '_') === code) {
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

export function playAudio(
  dataUrl: string,
  start: number | null | undefined,
  end: number | null | undefined
) {
  const audio = new Audio(dataUrl);
  if (start != null) audio.fastSeek(start);

  const timeupdate = () => {
    if (end && audio.currentTime >= end) audio.pause();
  };
  audio.addEventListener('timeupdate', timeupdate);
  audio.play().catch((e) => console.error(e));
  return audio;
}

export function useSpeechAndAudio() {
  const [lastAudio, setLastAudio] = useState(new Audio());
  const [timePosition, setTimePosition] = useState(0);

  useEffect(() => {
    const timeupdate = () => {
      setTimePosition(Math.floor(lastAudio.currentTime));
    };
    lastAudio.addEventListener('timeupdate', timeupdate);

    return () => {
      lastAudio.removeEventListener('timeupdate', timeupdate);
      setTimePosition(0);
      lastAudio.pause();
    };
  }, [lastAudio]);

  const playAudioInScope = useCallback(
    (
      dataUrl: string,
      start: number | null | undefined,
      end: number | null | undefined
    ) => {
      setLastAudio(playAudio(dataUrl, start, end));
    },
    [setLastAudio]
  );

  const speakInScope = useCallback((language: string, text: string) => {
    speak(language, text);
  }, []);

  return { playAudioInScope, speakInScope, timePosition };
}
