import {memoizeBySomeProperties} from "kamo-reducers/memoizers";
import {initialState} from "../state";
import {endOfDay, endOfMonth, endOfWeek, minutesOfTime, startOfDay, startOfMonth, startOfWeek} from "../utils/time";

export const computeStartOfDay = memoizeBySomeProperties({
  now: initialState.now
}, (state) => {
  return minutesOfTime(startOfDay(state.now));
});

export const computeStartOfWeek = memoizeBySomeProperties({
  now: initialState.now
}, (state) => {
  return minutesOfTime(startOfWeek(state.now));
});

export const computeStartOfMonth = memoizeBySomeProperties({
  now: initialState.now
}, (state) => {
  return minutesOfTime(startOfMonth(state.now));
});

export const computeEndOfDay = memoizeBySomeProperties({
  now: initialState.now
}, (state) => {
  return minutesOfTime(endOfDay(state.now));
});

export const computeEndOfWeek = memoizeBySomeProperties({
  now: initialState.now
}, (state) => {
  return minutesOfTime(endOfWeek(state.now));
});

export const computeEndOfMonth = memoizeBySomeProperties({
  now: initialState.now
}, (state) => {
  return minutesOfTime(endOfMonth(state.now));
});
