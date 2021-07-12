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
export async function playAudio(blob: Blob, path: string) {
  console.log('playing audio');
  mapSome(lastAudio, lastAudio => lastAudio.pause());
  const contentType = getMimeFromFileName(path);
  await mapSomeAsync(contentType, async contentType => {
    const file = new File([blob], path, { type: contentType });

    const reader = new FileReader();
    reader.readAsDataURL(file);

    await new Promise<void>((resolve, reject) => {
      reader.onerror = reject;
      reader.onload = () => resolve();
    });

    const audio = new Audio(reader.result as any);
    lastAudio = some(audio);
    await audio.play();
  });
}