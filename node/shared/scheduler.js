"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.newSchedule = exports.scheduledBy = exports.isWrongAnswer = exports.isDelayDetails = exports.defaultFactorScheduler = exports.medianSchedule = exports.configuredScheduler = exports.minimalIntervalOf = exports.DAY = exports.HOUR = exports.MINUTE = void 0;
exports.MINUTE = 1;
exports.HOUR = exports.MINUTE * 60;
exports.DAY = exports.HOUR * 24;
var VARIANCE = 0.8;
function minimalIntervalOf(isNew) {
    return isNew ? 10 * exports.MINUTE : exports.DAY;
}
exports.minimalIntervalOf = minimalIntervalOf;
function configuredScheduler(random) {
    if (random === void 0) { random = function () { return Math.random(); }; }
    function intervalFrom(factor, baseInterval, answeredInterval, willRemainNew, wasNew) {
        var baseFactor = Math.min(factor, 1.0);
        var bonusFactor = Math.max(0.0, factor - 1.0);
        var randomFactor = random() * VARIANCE + (1.0 - VARIANCE / 2);
        var currentInterval = Math.max(baseInterval, minimalIntervalOf(wasNew));
        var earlyAnswerMultiplier = Math.min(1.0, answeredInterval / currentInterval);
        earlyAnswerMultiplier =
            1 - Math.sin((Math.PI / 2) * (1 - earlyAnswerMultiplier));
        var effectiveFactor = baseFactor + bonusFactor * earlyAnswerMultiplier * randomFactor;
        var nextInterval = Math.max(currentInterval * effectiveFactor, minimalIntervalOf(willRemainNew));
        return Math.floor(nextInterval);
    }
    return function (schedule, factor, answeredMinutes, delayFactor) {
        if (delayFactor === void 0) { delayFactor = null; }
        var nextSchedule = __assign({}, schedule);
        answeredMinutes = Math.floor(answeredMinutes);
        var willRemainNew = nextSchedule.isNew && factor < 2;
        var wasNew = nextSchedule.isNew;
        var answeredInterval = answeredMinutes - schedule.lastAnsweredMinutes;
        var nextInterval = intervalFrom(factor, schedule.intervalMinutes, answeredInterval, willRemainNew, wasNew);
        if (delayFactor) {
            var nextDelayInterval = intervalFrom(delayFactor, schedule.delayIntervalMinutes || 0, Infinity, willRemainNew, wasNew);
            nextSchedule.delayIntervalMinutes = nextDelayInterval;
            nextSchedule.nextDueMinutes = answeredMinutes + nextDelayInterval;
        }
        else {
            nextSchedule.delayIntervalMinutes = 0;
            nextSchedule.nextDueMinutes = answeredMinutes + nextInterval;
        }
        nextSchedule.lastAnsweredMinutes = answeredMinutes;
        nextSchedule.intervalMinutes = nextInterval;
        nextSchedule.isNew = willRemainNew;
        return nextSchedule;
    };
}
exports.configuredScheduler = configuredScheduler;
function medianSchedule(existingSchedules) {
    var nextSchedule = __assign({}, exports.newSchedule);
    if (existingSchedules.length === 0)
        return nextSchedule;
    nextSchedule.isNew = existingSchedules.every(function (s) { return s.isNew; });
    var summedInterval = existingSchedules.reduce(function (sum, sch) { return sum + sch.intervalMinutes; }, 0);
    var averageInterval = summedInterval / existingSchedules.length;
    nextSchedule.intervalMinutes = Math.floor(averageInterval * 0.6);
    return nextSchedule;
}
exports.medianSchedule = medianSchedule;
exports.defaultFactorScheduler = configuredScheduler();
function isDelayDetails(answer) {
    return answer[0] === 'd';
}
exports.isDelayDetails = isDelayDetails;
function isWrongAnswer(ad) {
    if (isDelayDetails(ad))
        return true;
    return ad[1] <= 1.0;
}
exports.isWrongAnswer = isWrongAnswer;
function scheduledBy(schedule, answer) {
    var details = answer[1];
    if (isDelayDetails(details)) {
        return (0, exports.defaultFactorScheduler)(schedule, details[1], answer[0], details[2]);
    }
    else {
        return (0, exports.defaultFactorScheduler)(schedule, details[1], answer[0]);
    }
}
exports.scheduledBy = scheduledBy;
exports.newSchedule = {
    lastAnsweredMinutes: 0,
    nextDueMinutes: 0,
    delayIntervalMinutes: 0,
    intervalMinutes: 0,
    isNew: true
};
