import {Schedule} from "./model";

// export const SECOND = 1000;
export const MINUTE = 1;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

const VARIANCE = 0.8;

function minimalIntervalOf(schedule: Schedule) {
  return schedule.isNew ? 10 * MINUTE : DAY;
}

export function configuredScheduler(random = () => Math.random()) {
  return (schedule: Schedule, factor: number, answered: number) => {
    let nextSchedule = {...schedule};

    answered = Math.floor(answered);

    let minimumInterval = minimalIntervalOf(schedule);

    if (factor == 0.0) {
      nextSchedule.lastAnsweredMinutes = answered;
      nextSchedule.nextDueMinutes = answered + minimumInterval;
      return nextSchedule;
    }

    if (factor >= 2) nextSchedule.isNew = false;

    var baseFactor = Math.min(factor, 1.0);
    var bonusFactor = Math.max(0.0, factor - 1.0);
    var randomFactor = random() * VARIANCE + (1.0 - VARIANCE / 2);

    var answeredInterval = answered - schedule.lastAnsweredMinutes;
    var currentInterval = Math.max(schedule.intervalMinutes, minimumInterval);
    var earlyAnswerMultiplier = Math.min(1.0, answeredInterval / currentInterval);

    var effectiveFactor = baseFactor + (bonusFactor * earlyAnswerMultiplier * randomFactor);
    var nextInterval = Math.max(currentInterval * effectiveFactor, minimumInterval);
    nextInterval = Math.floor(nextInterval);

    nextSchedule.lastAnsweredMinutes = answered;
    nextSchedule.nextDueMinutes = answered + nextInterval;
    nextSchedule.intervalMinutes = nextInterval;

    return nextSchedule;
  }
}
