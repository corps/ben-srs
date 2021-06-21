import {memoizeBySomeProperties} from "kamo-reducers/memoizers";
import {initialState, newStudyData} from "../state";
import {Indexer} from "redux-indexers";
import {daysOfTime, endOfDay, minutesOfTime, startOfDay} from "../utils/time";
import {findNextStudyCloze} from "../study";

export const computeStudyData = memoizeBySomeProperties({
  indexes: initialState.indexes,
  inputs: {curLanguage: initialState.inputs.curLanguage},
  toggles: {studySpoken: initialState.toggles.studySpoken},
  startOfDayMinutes: initialState.startOfDayMinutes,
  now: initialState.now,
}, (state) => {
  const result = {...newStudyData};
  const language = state.inputs.curLanguage.value;
  const spoken = state.toggles.studySpoken;
  const nowMinutes = minutesOfTime(state.now);

  let languageStartKey = [language];
  let studyStartKey = [language, spoken, false];

  let endOfCurDay = 0;
  let startOfCurDay = 0;

  let nextDue = findNextStudyCloze(language, nowMinutes, state.indexes, spoken);
  if (nextDue) {
    let nextDueTime = nextDue.attributes.schedule.nextDueMinutes * 1000 * 60;
    endOfCurDay = minutesOfTime(endOfDay(nextDueTime));
    startOfCurDay = minutesOfTime(startOfDay(nextDueTime));
    result.dayBucket = daysOfTime(nextDueTime);
  }

  let range = Indexer.getRangeFrom(state.indexes.terms.byLanguage, languageStartKey, [language, Infinity]);
  result.terms = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(state.indexes.clozes.byLanguageSpokenAndNextDue, studyStartKey, [language, spoken, true, Infinity]);
  result.clozes = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(state.indexes.clozeAnswers.byLanguageAndAnswered,
    [language, state.startOfDayMinutes], [language, Infinity]);
  result.studied = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(state.indexes.clozes.byLanguageSpokenAndNextDue,
    [language, spoken, true], [language, spoken, true, nowMinutes + 1]);
  result.due = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(state.indexes.clozes.byLanguageSpokenAndNextDue,
    [language, spoken, true], [language, spoken, true, 1]);
  result.new = range.endIdx - range.startIdx;

  range = Indexer.getRangeFrom(state.indexes.clozes.byLanguageSpokenAndNextDue,
    [language, spoken, true, startOfCurDay], [language, spoken, true, endOfCurDay]);
  result.remainingInDay = range.endIdx - range.startIdx;

  let answersIter = Indexer.iterator(
    state.indexes.clozeAnswers.byLanguageAndAnswered,
    [language, state.startOfDayMinutes],
    [language, Infinity]);

  let answerTimes: number[] = [];

  result.studyTimeMinutes = 0;

  let lastAnswer = 0;
  let sessionStart = 0;

  for (let answer = answersIter(); answer; answer = answersIter()) {
    let answered = answer.answer[0];
    answerTimes.push(answered);
  }

  if (answerTimes.length > 0) answerTimes.push(answerTimes[answerTimes.length - 1] + 1);
  answerTimes.push(Infinity);

  for (let answered of answerTimes) {
    let diff = answered - lastAnswer;

    if (diff > 5) {
      let sessionLength = lastAnswer - sessionStart;
      sessionStart = answered;

      result.studyTimeMinutes += sessionLength;
    }

    lastAnswer = answered;
  }

  return result;
});
