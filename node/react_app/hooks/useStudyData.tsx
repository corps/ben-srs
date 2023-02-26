import { minutesOfTime, startOfDay } from '../utils/time';
import { useEffect, useState } from 'react';
import { Indexer } from '../../shared/indexable';
import { Cloze, indexesInitialState, Tagged } from '../notes';
import { mapSome, Maybe, withDefault, zipSome } from '../../shared/maybe';
import { okAnswerFactor } from '../study';
import { useTime } from './useTime';
import { useNotesIndex } from './useNotesIndex';
import { useStudyContext } from './useStudyContext';

export const newStudyData = {
  studied: 0,
  due: 0,
  new: 0,
  delayed: 0,
  terms: 0,
  clozes: 0,
  status: ''
};

export type StudyData = typeof newStudyData;

export function calculateAverageDailyIntake(
  taggedClozes: typeof indexesInitialState.taggedClozes,
  nowMinutes: number,
  tag: string,
  audioStudy: boolean,
  studyEnd: Maybe<number> = null
) {
  function findStudyEndBySpoken(spoken: boolean) {
    return mapSome(
      Indexer.reverseIter(taggedClozes.byTagSpokenAndNextDue, [
        tag,
        spoken,
        true,
        Infinity
      ])(),
      (m: Tagged<Cloze>) => m.inner.attributes.schedule.nextDueMinutes
    );
  }

  function countOccurrences(
    startMinutes: number,
    endMinutes: number,
    startInterval: number,
    intervalRate: number
  ) {
    const result =
      Math.max(0, Math.log((endMinutes - startMinutes) / startInterval)) /
        Math.log(intervalRate) +
      1;
    return result;
  }

  function calculateOccurrencesBySpoken(
    spoken: boolean,
    studyEnd: number,
    nowMinutes: number
  ) {
    const iter = Indexer.iterator(
      taggedClozes.byTagSpokenAndNextDue,
      [tag, spoken, true],
      [tag, spoken, true, studyEnd + 1, null]
    );

    let result = 0;

    for (let next = iter(); next; next = iter()) {
      mapSome(next, ({ inner }) => {
        result += countOccurrences(
          Math.max(inner.attributes.schedule.nextDueMinutes, nowMinutes),
          studyEnd,
          Math.max(inner.attributes.schedule.intervalMinutes, 1),
          okAnswerFactor(10000, inner.attributes.type)
        );
      });
    }

    return result;
  }

  if (!studyEnd) {
    studyEnd = findStudyEndBySpoken(audioStudy);
    if (audioStudy) {
      studyEnd = zipSome(studyEnd, findStudyEndBySpoken(false), (a, b) =>
        a > b ? a : b
      );
    }
  }

  return withDefault(
    mapSome(studyEnd, (studyEnd) => {
      let occurrences = calculateOccurrencesBySpoken(
        audioStudy,
        studyEnd,
        nowMinutes
      );
      if (audioStudy)
        occurrences += calculateOccurrencesBySpoken(
          false,
          studyEnd,
          nowMinutes
        );
      const days = (studyEnd - nowMinutes) / (60 * 24);
      return occurrences / days;
    }),
    0
  );
}

export function useStudyData() {
  const [notesIndex] = useNotesIndex();
  const now = useTime();
  const minutesNow = minutesOfTime(now);
  const [{ tag, audioStudy, target, isSyncing }] = useStudyContext();
  const startOfCurDay = minutesOfTime(startOfDay(now));

  const [studyData, setStudyData] = useState(newStudyData);

  useEffect(() => {
    setStudyData((studyData) => {
      const result = { ...newStudyData };
      const languageStartKey = [tag];

      let range = Indexer.getRangeFrom(
        notesIndex.taggedTerms.byTag,
        languageStartKey,
        [tag, Infinity]
      );
      result.terms = range.endIdx - range.startIdx;

      range = Indexer.getRangeFrom(
        notesIndex.taggedClozeAnswers.byTagAndAnswered,
        [tag, startOfCurDay],
        [tag, Infinity]
      );
      result.studied = range.endIdx - range.startIdx;

      function addByAudioStudy(audioStudy: boolean) {
        range = Indexer.getRangeFrom(
          notesIndex.taggedClozes.byTagSpokenAndNextDue,
          [tag, audioStudy, false],
          [tag, audioStudy, true, Infinity]
        );
        result.clozes += range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(
          notesIndex.taggedClozes.byTagSpokenAndNextDue,
          [tag, audioStudy, true],
          [tag, audioStudy, true, minutesNow + 1]
        );
        result.due += range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(
          notesIndex.taggedClozes.byTagSpokenAndNextDue,
          [tag, audioStudy, true],
          [tag, audioStudy, true, 1]
        );
        result.new += range.endIdx - range.startIdx;

        range = Indexer.getRangeFrom(
          notesIndex.taggedClozes.byTagSpokenAndNextDue,
          [tag, audioStudy, false],
          [tag, audioStudy, false, Infinity]
        );
        result.delayed += range.endIdx - range.startIdx;
      }

      addByAudioStudy(audioStudy);
      if (audioStudy) addByAudioStudy(false);

      if (!isSyncing || !studyData.clozes) {
        const adi = calculateAverageDailyIntake(
          notesIndex.taggedClozes,
          minutesNow,
          tag,
          audioStudy,
          mapSome(target, (target) => minutesNow + target * 60 * 24)
        );

        let status = 'green fw6';
        const remainingAdi = Math.max(Math.floor(adi) - result.studied, 0);
        if (remainingAdi > 0) status = 'red fw6';
        else if (result.due > 0) status = 'yellow fw6';
        result.status = status;
        result.due = Math.min(result.due, remainingAdi);
      } else {
        result.due = studyData.due;
        result.status = studyData.status;
      }

      return result;
    });
  }, [
    tag,
    audioStudy,
    startOfCurDay,
    notesIndex.taggedTerms.byTag,
    notesIndex.taggedClozes,
    notesIndex.taggedClozeAnswers.byTagAndAnswered,
    minutesNow,
    target,
    isSyncing
  ]);

  return studyData;
}
