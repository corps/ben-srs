import {useNotesIndex} from "./contexts";
import {endOfDay, minutesOfTime, startOfDay, timeOfMinutes} from "../utils/time";
import {useMemo} from "react";
import {Indexer} from "../utils/indexable";
import {findNextStudyCloze, findNextStudyDetails} from "../study";
import {mapSome} from "../utils/maybe";

export const newStudyData = {
    studied: 0,
    due: 0,
    new: 0,
    terms: 0,
    clozes: 0,
    nextDueAt: 0,
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

        let endOfCurDay = startOfDay(minutesNow);
        let startOfCurDay = endOfDay(minutesNow);

        let range = Indexer.getRangeFrom(notesIndex.terms.byLanguage, languageStartKey,
            [language, Infinity]);
        result.terms = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.clozes.byLanguageSpokenAndNextDue, studyStartKey,
            [language, audioStudy, true, Infinity]);
        result.clozes = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.clozeAnswers.byLanguageAndAnswered,
            [language, startOfCurDay], [language, Infinity]);
        result.studied = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.clozes.byLanguageSpokenAndNextDue,
            [language, audioStudy, true], [language, audioStudy, true, minutesNow + 1]);
        result.due = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.clozes.byLanguageSpokenAndNextDue,
            [language, audioStudy, true], [language, audioStudy, true, 1]);
        result.new = range.endIdx - range.startIdx;

        const nextDue = findNextStudyCloze(language, minutesNow, notesIndex, audioStudy);
        mapSome(nextDue, nextDue => {
            result.nextDueAt = timeOfMinutes(nextDue.attributes.schedule.nextDueMinutes);
        })

        return result;
    }, [
        minutesNow, language, audioStudy, notesIndex.notes,
        notesIndex.clozes, notesIndex.terms, notesIndex.clozeAnswers
    ]);
}