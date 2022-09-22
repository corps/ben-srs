import { useCallback, useEffect, useState } from "react";
import { speak, playAudio } from "../services/speechAndAudio";

export function useSpeechAndAudio() {
    const [lastAudio, setLastAudio] = useState(new Audio());
    const [timePosition, setTimePosition] = useState(0);

    useEffect(() => {
        const timeupdate = () => {
          setTimePosition(Math.floor(lastAudio.currentTime));
        }
        lastAudio.addEventListener('timeupdate', timeupdate);
        
        return () => {
            lastAudio.removeEventListener('timeupdate', timeupdate);
            setTimePosition(0);
            lastAudio.pause();
        }
    }, [lastAudio]);

    const playAudioInScope = useCallback((dataUrl: string, start: number | null | undefined, end: number | null | undefined) => {
        setLastAudio(playAudio(dataUrl, start, end));
    }, [setLastAudio]);

    const speakInScope = useCallback((language: string, text: string) => {
        speak(language, text);
    }, []);

    return {playAudioInScope, speakInScope, timePosition};
}
