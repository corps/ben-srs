import React, {useCallback, useState} from 'react';
import {useRoute, useStudyContext} from "../hooks/contexts";
import {WorkflowLinks} from "./SimpleNavLink";
import {useWithKeybinding} from "../hooks/useWithKeybinding";
import {useToggle} from "../hooks/useToggle";
import {speak} from "../services/speechAndAudio";


interface Props {
    onReturn?: () => void,
}

function pickNextNumber() {
    if (Math.random() < 0.1) {
        if (Math.random() < 0.9) {
            return Math.random().toFixed(2)
        }
        return (Math.random() * 10).toFixed(2)
    }

    if (Math.random() < 0.7) {
        return Math.floor(Math.random() * 10000);
    }

    if (Math.random() < 0.7) {
        return Math.floor(Math.random() * 1000000000000);
    }

    return Math.floor(Math.random() * -10000);
}

export function NumberTraining(props: Props) {
    const setRoute = useRoute();
    const {onReturn = () => setRoute(() => null)} = props;
    const [number, setNumber] = useState(pickNextNumber);
    const [showNumber, setShowNumber] = useState(false);
    const [studyContext, setStudyContext] = useStudyContext();

    const next = useCallback(() => {
        setNumber(pickNextNumber);
        setShowNumber(false);
    }, [])

    const speakIt = useCallback(() => {
        speak(studyContext.tag, `${number}`)
    },[number, studyContext]);

    const [NextWrapper] = useWithKeybinding('a', next);
    const [SpeakWrapper] = useWithKeybinding('j', speakIt);
    const [ShowWrapper] = useWithKeybinding('f', () => setShowNumber(true));

    return <div className="mw6 center">
        <div className="tc">
            <WorkflowLinks onReturn={onReturn}/>
        </div>
        <div className="lh-copy f4 tc mt3">
            { showNumber ? number : null }

            <div>
                <button
                    className="ml3 br2"
                    onClick={speakIt}>
                    <SpeakWrapper>
                        読み上げ
                    </SpeakWrapper>
                </button>
                <button
                    className="ml3 br2"
                    onClick={() => setShowNumber(true)}>
                    <ShowWrapper>
                        表示
                    </ShowWrapper>
                </button>
                <button
                    className="ml3 br2"
                    onClick={next}>
                    <NextWrapper>
                        次
                    </NextWrapper>
                </button>
            </div>
        </div>
    </div>
}