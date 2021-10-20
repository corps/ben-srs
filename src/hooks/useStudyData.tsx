import {useNotesIndex, useTags} from "./contexts";
import {endOfDay, minutesOfTime, startOfDay} from "../utils/time";
import {useMemo} from "react";
import {Indexer} from "../utils/indexable";

export const newStudyData = {
    studied: 0,
    due: 0,
    new: 0,
    delayed: 0,
};

export type StudyData = typeof newStudyData;

export function useStudyData(
    now = Date.now(),
    language: string,
    audioStudy: boolean,
) {
    const notesIndex = useNotesIndex();
    const minutesNow = minutesOfTime(now);
    const [curTags] = useTags();
    let startOfCurDay = minutesOfTime(startOfDay(now));

    return useMemo(() => {
        const result = {...newStudyData};

        let noteIds: string[] = [];
        if (curTags.length) {
            curTags.forEach(tag => {
                noteIds.push(...Indexer.getAllMatching(notesIndex.tags.byTagAndNoteId, [tag]).map(v => v[0]));
            })
        }

        let range = Indexer.getRangeFrom(notesIndex.clozeAnswers.byLanguageAndAnswered,
            [language, startOfCurDay], [language, Infinity]);
        result.studied = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.clozes.byLanguageSpokenAndNextDue,
            [language, audioStudy, true], [language, audioStudy, true, 1]);
        result.new = range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(notesIndex.clozes.byLanguageSpokenAndNextDue,
          [language, audioStudy, false], [language, audioStudy, false, Infinity]);
        result.delayed = range.endIdx - range.startIdx;

        return result;
    }, [minutesNow, language, audioStudy, notesIndex.clozes, notesIndex.terms, notesIndex.clozeAnswers, now]);
}