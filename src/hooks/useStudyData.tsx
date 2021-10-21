import {useNotesIndex} from "./contexts";
import {endOfDay, minutesOfTime, startOfDay} from "../utils/time";
import {useMemo} from "react";
import {Indexer} from "../utils/indexable";

export const newStudyData = {
    studied: 0,
    due: 0,
    new: 0,
    delayed: 0,
    terms: 0,
    clozes: 0,
};

export type StudyData = typeof newStudyData;

export function useStudyData(
    now = Date.now(),
    language: string,
    audioStudy: boolean,
) {
    const notesIndex = useNotesIndex();
    const minutesNow = minutesOfTime(now);

    return useMemo(() => {
        const languageStartKey = [language];
        const studyStartKey = [language, audioStudy, false];
        const result = {...newStudyData};

        let startOfCurDay = minutesOfTime(startOfDay(now));

        let range = Indexer.getRangeFrom(notesIndex.taggedTerms.byTag, languageStartKey,
            [language, Infinity]);
        result.terms = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.taggedClozes.byTagSpokenAndNextDue, studyStartKey,
            [language, audioStudy, true, Infinity]);
        result.clozes = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.taggedClozeAnswers.byTagAndAnswered,
            [language, startOfCurDay], [language, Infinity]);
        result.studied = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.taggedClozes.byTagSpokenAndNextDue,
            [language, audioStudy, true], [language, audioStudy, true, minutesNow + 1]);
        result.due = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.taggedClozes.byTagSpokenAndNextDue,
            [language, audioStudy, true], [language, audioStudy, true, 1]);
        result.new = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.taggedClozes.byTagSpokenAndNextDue,
          [language, audioStudy, false], [language, audioStudy, false, Infinity]);
        result.delayed = range.endIdx - range.startIdx;

        return result;
    }, [language, audioStudy, now, notesIndex.taggedTerms.byTag, notesIndex.taggedClozes.byTagSpokenAndNextDue, notesIndex.taggedClozeAnswers.byTagAndAnswered, minutesNow]);
}