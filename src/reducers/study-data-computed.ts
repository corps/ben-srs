import {memoizeBySomeProperties} from "kamo-reducers/memoizers";
import {Counts, initialState, newCounts, newStudyData} from "../state";
import {Index, Indexer} from "redux-indexers";
import {minutesOfTime} from "../utils/time";

function getPastCounts(index: Index<any>, state: {
  startOfDayMinutes: number,
  startOfWeekMinutes: number,
  startOfMonthMinutes: number,
}, baseKey: any[], endKey: any[]): Counts {
  let result = {...newCounts};

  let range = Indexer.getRangeFrom(index, baseKey.concat([state.startOfDayMinutes]), endKey);
  result.today = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(index, baseKey.concat([state.startOfWeekMinutes]), endKey);
  result.week = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(index, baseKey.concat([state.startOfMonthMinutes]), endKey);
  result.month = range.endIdx - range.startIdx;

  return result;
}

function getFutureCounts(index: Index<any>, state: {
  endOfDayMinutes: number,
  endOfWeekMinutes: number,
  endOfMonthMinutes: number,
}, startKey: any[], baseEndKey: any[]): Counts {
  let result = {...newCounts};
  let range = Indexer.getRangeFrom(index, startKey, baseEndKey.concat([state.endOfDayMinutes]));
  result.today = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(index, startKey, baseEndKey.concat([state.endOfWeekMinutes]));
  result.week = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(index, startKey, baseEndKey.concat([state.endOfMonthMinutes]));
  result.month = range.endIdx - range.startIdx;

  return result;
}

export const computeStudyData = memoizeBySomeProperties({
  indexes: initialState.indexes,
  now: initialState.now,
  inputs: {curLanguage: initialState.inputs.curLanguage},
  startOfDayMinutes: initialState.startOfDayMinutes,
  startOfWeekMinutes: initialState.startOfWeekMinutes,
  startOfMonthMinutes: initialState.startOfMonthMinutes,
  endOfDayMinutes: initialState.endOfDayMinutes,
  endOfWeekMinutes: initialState.endOfWeekMinutes,
  endOfMonthMinutes: initialState.endOfMonthMinutes,
}, (state) => {
  const result = {...newStudyData};
  const language = state.inputs.curLanguage;

  let languageStartKey = [language];

  let range = Indexer.getRangeFrom(state.indexes.terms.byLanguage, languageStartKey, [language, Infinity]);
  result.terms = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(state.indexes.clozes.byLanguageAndNextDue, languageStartKey, [language, Infinity]);
  result.clozes = range.endIdx - range.startIdx;

  result.newStudy = getPastCounts(
    state.indexes.clozeAnswers.byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx,
    state, languageStartKey, [language, Infinity]);

  const minutesOfNow = minutesOfTime(state.now);

  result.studied = getPastCounts(
    state.indexes.clozeAnswers.byLanguageAndAnswered,
    state, languageStartKey, [language, minutesOfNow]);

  result.due = getFutureCounts(
    state.indexes.clozes.byLanguageAndNextDue, state, languageStartKey, languageStartKey)

  let answersIter = Indexer.iterator(
    state.indexes.clozeAnswers.byLanguageAndAnswered,
    [language, state.startOfMonthMinutes],
    [language, minutesOfNow]);

  result.studyTimeMinutes = {...newCounts};

  let lastAnswer = 0;

  for (let answer = answersIter(); answer; answer = answersIter()) {
    let answered = answer.answer[0];
    let timeToAdd = answered - lastAnswer;

    if (timeToAdd < 5) {
      if (answered >= state.startOfWeekMinutes) {
        result.studyTimeMinutes.week += timeToAdd;
      }

      if (answered >= state.startOfDayMinutes) {
        result.studyTimeMinutes.today += timeToAdd;
      }

      if (answered >= state.startOfMonthMinutes) {
        result.studyTimeMinutes.month += timeToAdd;
      }
    }

    lastAnswer = answered;
  }

  return result;
});