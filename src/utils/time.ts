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
