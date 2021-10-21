import {useNotesIndex} from "./contexts";
import {minutesOfTime, startOfDay} from "../utils/time";
import {useMemo} from "react";
import {Indexer} from "../utils/indexable";

export const newStudyData = {
    studied: 0,
};

export type StudyData = typeof newStudyData;

export function useStudyData(
    now = Date.now(),
    language: string,
    audioStudy: boolean,
) {
    const notesIndex = useNotesIndex();
    const minutesNow = minutesOfTime(now);
    let startOfCurDay = minutesOfTime(startOfDay(now));

    return useMemo(() => {
        const result = {...newStudyData};
        let range = Indexer.getRangeFrom(notesIndex.clozeAnswers.byLanguageAndAnswered,
            [language, startOfCurDay], [language, Infinity]);
        result.studied = range.endIdx - range.startIdx;

        return result;
    }, [notesIndex.clozeAnswers.byLanguageAndAnswered, language, startOfCurDay]);
}