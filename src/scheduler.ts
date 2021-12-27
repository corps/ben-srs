// export const SECOND = 1000;
export const MINUTE = 1;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;

const VARIANCE = 0.8;

export function minimalIntervalOf(isNew: boolean) {
  return isNew ? 10 * MINUTE : DAY;
}

export function configuredScheduler(random = () => Math.random()) {
  function intervalFrom(factor: number,
                        baseInterval: number,
                        answeredInterval: number,
                        willRemainNew: boolean,
                        wasNew: boolean) {
    const baseFactor = Math.min(factor, 1.0);
    const bonusFactor = Math.max(0.0, factor - 1.0);
    const randomFactor = random() * VARIANCE + (1.0 - VARIANCE / 2);

    const currentInterval = Math.max(baseInterval, minimalIntervalOf(wasNew));
    let earlyAnswerMultiplier = Math.min(1.0, answeredInterval / currentInterval);
    earlyAnswerMultiplier = 1 - Math.sin(Math.PI / 2 * (1 - earlyAnswerMultiplier))

    const effectiveFactor = baseFactor + (bonusFactor * earlyAnswerMultiplier * randomFactor);
    const nextInterval = Math.max(currentInterval * effectiveFactor, minimalIntervalOf(willRemainNew));
    return Math.floor(nextInterval);
  }

  return (schedule: Schedule, factor: number, answeredMinutes: number, delayFactor = null as number | null) => {
    const nextSchedule = {...schedule};

    answeredMinutes = Math.floor(answeredMinutes);
    const willRemainNew = nextSchedule.isNew && factor < 2;
    const wasNew = nextSchedule.isNew;
    const answeredInterval = answeredMinutes - schedule.lastAnsweredMinutes;
    const nextInterval = intervalFrom(factor, schedule.intervalMinutes, answeredInterval, willRemainNew, wasNew);

    if (delayFactor) {
      const nextDelayInterval = intervalFrom(delayFactor, schedule.delayIntervalMinutes || 0, Infinity, willRemainNew, wasNew);

      nextSchedule.delayIntervalMinutes = nextDelayInterval;
      nextSchedule.nextDueMinutes = answeredMinutes + nextDelayInterval;
    } else {
      nextSchedule.delayIntervalMinutes = 0;
      nextSchedule.nextDueMinutes = answeredMinutes + nextInterval;
    }

    nextSchedule.lastAnsweredMinutes = answeredMinutes;
    nextSchedule.intervalMinutes = nextInterval;
    nextSchedule.isNew = willRemainNew;

    return nextSchedule;
  }
}

export function medianSchedule(existingSchedules: Schedule[]) {
  const nextSchedule = {...newSchedule};

  if (existingSchedules.length === 0) return nextSchedule;
  nextSchedule.isNew = existingSchedules.every(s => s.isNew);

  const summedInterval = existingSchedules.reduce((sum, sch) => sum + sch.intervalMinutes, 0);
  const averageInterval = summedInterval / existingSchedules.length;

  nextSchedule.intervalMinutes = Math.floor(averageInterval * 0.6);

  return nextSchedule;
}

export const defaultFactorScheduler = configuredScheduler();

export type DelayDetails = ["d", number, number];
export type FactorDetails = ["f", number];
export type AnswerDetails = DelayDetails | FactorDetails;
export type Answer = [number, AnswerDetails];

export function isDelayDetails(answer: AnswerDetails): answer is DelayDetails {
  return answer[0] === "d";
}

export function isWrongAnswer(ad: AnswerDetails) {
  if (isDelayDetails(ad)) return true;
  return ad[1] <= 1.0;
}

export function scheduledBy(schedule: Schedule, answer: Answer): Schedule {
  let details = answer[1];
  if (isDelayDetails(details)) {
    return defaultFactorScheduler(schedule, details[1], answer[0], details[2]);
  } else {
    return defaultFactorScheduler(schedule, details[1], answer[0]);
  }
}

export const newSchedule = {
  lastAnsweredMinutes: 0,
  nextDueMinutes: 0,
  delayIntervalMinutes: 0 as number | null,
  intervalMinutes: 0,
  isNew: true
};

export type Schedule = typeof newSchedule;
