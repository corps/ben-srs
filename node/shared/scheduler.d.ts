export declare const MINUTE = 1;
export declare const HOUR: number;
export declare const DAY: number;
export declare function minimalIntervalOf(isNew: boolean): number;
export declare function configuredScheduler(random?: () => number): (schedule: Schedule, factor: number, answeredMinutes: number, delayFactor?: number) => {
    lastAnsweredMinutes: number;
    nextDueMinutes: number;
    delayIntervalMinutes: number;
    intervalMinutes: number;
    isNew: boolean;
};
export declare function medianSchedule(existingSchedules: Schedule[]): {
    lastAnsweredMinutes: number;
    nextDueMinutes: number;
    delayIntervalMinutes: number;
    intervalMinutes: number;
    isNew: boolean;
};
export declare const defaultFactorScheduler: (schedule: Schedule, factor: number, answeredMinutes: number, delayFactor?: number) => {
    lastAnsweredMinutes: number;
    nextDueMinutes: number;
    delayIntervalMinutes: number;
    intervalMinutes: number;
    isNew: boolean;
};
export type DelayDetails = ['d', number, number];
export type FactorDetails = ['f', number];
export type AnswerDetails = DelayDetails | FactorDetails;
export type Answer = [number, AnswerDetails];
export declare function isDelayDetails(answer: AnswerDetails): answer is DelayDetails;
export declare function isWrongAnswer(ad: AnswerDetails): boolean;
export declare function scheduledBy(schedule: Schedule, answer: Answer): Schedule;
export declare const newSchedule: {
    lastAnsweredMinutes: number;
    nextDueMinutes: number;
    delayIntervalMinutes: number;
    intervalMinutes: number;
    isNew: boolean;
};
export type Schedule = typeof newSchedule;
