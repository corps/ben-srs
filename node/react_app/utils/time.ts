const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export function startOfDay(now: number) {
  let date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function startOfWeek(now: number) {
  let date = new Date(now);
  let day = date.getDay();

  return startOfDay(now) - day * DAY;
}

export function startOfMonth(now: number) {
  let date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(1);

  return date.getTime();
}

export function endOfDay(now: number) {
  return startOfDay(now) + DAY;
}

export function endOfWeek(now: number) {
  return startOfWeek(now) + WEEK;
}

export function endOfMonth(now: number) {
  let date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
}

export function minutesOfTime(time: number) {
  return Math.floor(time / (1000 * 60));
}

export function timeOfMinutes(minutes: number) {
  return minutes * 60 * 1000;
}

export function daysOfTime(time: number) {
  return Math.floor(time / (1000 * 60 * 60 * 24));
}

export function describeDuration(time: number, withoutFixes = true) {
  if (withoutFixes) return describeAbsDuration(time);

  if (time < 0) {
    return '後' + describeAbsDuration(time);
  }

  return describeAbsDuration(time) + '前';
}

function describeAbsDuration(time: number) {
  let absTime = Math.abs(time);

  let seconds = Math.floor(absTime / 1000);
  if (seconds < 60) return seconds + '秒';

  let minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + '分';

  let hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + '時間';

  let days = Math.floor(hours / 24);
  if (days < 30) return days + '日';

  let months = Math.floor(days / 30);
  return months + '月';
}
