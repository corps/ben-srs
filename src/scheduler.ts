import {Schedule} from "./model";

// export const SECOND = 1000;
export const MINUTE = 1;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

const VARIANCE = 0.8;

export function minimalIntervalOf(schedule: Schedule) {
  return schedule.isNew ? 10 * MINUTE : DAY;
}

export function configuredScheduler(random = () => Math.random()) {
  return (schedule: Schedule, factor: number, answeredMinutes: number) => {
    let nextSchedule = {...schedule};

    answeredMinutes = Math.floor(answeredMinutes);

    if (factor == 0.0) {
      nextSchedule.lastAnsweredMinutes = answeredMinutes;
      nextSchedule.nextDueMinutes = answeredMinutes + HOUR;
      return nextSchedule;
    }

    if (factor >= 2) nextSchedule.isNew = false;

    var baseFactor = Math.min(factor, 1.0);
    var bonusFactor = Math.max(0.0, factor - 1.0);
    var randomFactor = random() * VARIANCE + (1.0 - VARIANCE / 2);

    var answeredInterval = answeredMinutes - schedule.lastAnsweredMinutes;
    var currentInterval = Math.max(schedule.intervalMinutes, minimalIntervalOf(schedule));
    var earlyAnswerMultiplier = Math.min(1.0, answeredInterval / currentInterval);

    var effectiveFactor = baseFactor + (bonusFactor * earlyAnswerMultiplier * randomFactor);
    var nextInterval = Math.max(currentInterval * effectiveFactor, minimalIntervalOf(nextSchedule));
    nextInterval = Math.floor(nextInterval);

    nextSchedule.lastAnsweredMinutes = answeredMinutes;
    nextSchedule.nextDueMinutes = answeredMinutes + nextInterval;
    nextSchedule.intervalMinutes = nextInterval;

    return nextSchedule;
  }
}

export function delayScheduleBy(schedule: Schedule, minutes: number, answeredMinutes: number) {
  answeredMinutes = Math.floor(answeredMinutes);

  schedule = {...schedule};
  schedule.lastAnsweredMinutes = answeredMinutes;
  schedule.nextDueMinutes = answeredMinutes + minutes;

  return schedule;
}
