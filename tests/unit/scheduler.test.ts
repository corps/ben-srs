import {assert, test, testModule} from "../qunit";
import {configuredScheduler, DAY, minimalIntervalOf, MINUTE} from "../../src/scheduler";
import {newSchedule, Schedule} from "../../src/storage";

testModule("unit/scheduler");

function intervalOf(schedule: Schedule) {
  assert.equal(schedule.intervalMinutes, schedule.nextDueMinutes - schedule.lastAnsweredMinutes);
  return schedule.intervalMinutes;
}

const scheduler = configuredScheduler(() => 0.5);

test("lastAnswered is set to the provided answered time", () => {
  var schedule = {...newSchedule};
  schedule.lastAnsweredMinutes = 34819;
  assert.equal(scheduler(schedule, 200, 604910).lastAnsweredMinutes, 604910);
});

test("scheduling a new, empty schedule with a >= 2.0 factor", (assert) => {
  var schedule = {...newSchedule};

  var next = scheduler(schedule, 2, 100);

  assert.equal(next.isNew, false, "sets isNew to false");
  assert.equal(intervalOf(next), DAY, "uses a single day as its interval");
});

test("scheduling a new, empty schedule with a >= 2.0 factor long after it was due", () => {
  var scheduler = configuredScheduler(() => 0.5);
  var schedule = {...newSchedule};

  schedule.nextDueMinutes = 5 * DAY;

  var next = scheduler(schedule, 20, 10 * DAY);

  assert.equal(intervalOf(next), DAY, "still uses a single day as its minimal interval");
});

test("scheduling a new, empty schedule with a < 2.0 factor", () => {
  var schedule = {...newSchedule};

  var next = scheduler(schedule, 0.5, 1000);

  assert.equal(next.isNew, true, "keeps isNew to true");
  assert.equal(intervalOf(next), 10 * MINUTE, "uses 10 minutes as its interval");
});

test("scheduling a non new, < 2.0 factor", () => {
  var schedule = {...newSchedule};
  schedule.isNew = false;

  var next = scheduler(schedule, 0.3, 1000);

  assert.equal(next.isNew, false, "keeps isNew to false");
});

test("scheduling a non new, >= 2.0 factor", () => {
  var schedule = {...newSchedule};
  schedule.isNew = false;

  var next = scheduler(schedule, 3.3, 1000);

  assert.equal(next.isNew, false, "keeps isNew to false");
});

test("scheduling non new cards with various intervals and factors", () => {
  var schedule = {...newSchedule};
  schedule.isNew = false;

  var minimal = minimalIntervalOf(false);
  var minimalRatioInterval: number;
  var factor: number;
  var intervalRatioWaited: number;

  function assertResultingInterval(expected: number) {
    var interval = minimal * minimalRatioInterval;
    schedule.nextDueMinutes = schedule.lastAnsweredMinutes + interval;
    schedule.intervalMinutes = interval;

    assert.equal(
      intervalOf(scheduler(schedule, factor, schedule.lastAnsweredMinutes + interval * intervalRatioWaited)),
      expected, `when factor = ${factor},` + "\n" +
      `the interval is ${Math.floor(minimalRatioInterval * 100)}% of the minimal,` + "\n" +
      `and answered time is ${Math.floor(intervalRatioWaited * 100)}% of the interval`)
  }

  factor = 0.6;
  {
    minimalRatioInterval = 1;
    {
      intervalRatioWaited = 1;
      assertResultingInterval(minimal);

      intervalRatioWaited = 0.25;
      assertResultingInterval(minimal);

      intervalRatioWaited = 3;
      assertResultingInterval(minimal);
    }

    minimalRatioInterval = 2;
    {
      intervalRatioWaited = 1;
      assertResultingInterval(minimal * 1.2);

      intervalRatioWaited = 0.25;
      assertResultingInterval(minimal * 1.2);

      intervalRatioWaited = 3;
      assertResultingInterval(minimal * 1.2);
    }
  }

  factor = 2.0;
  {
    minimalRatioInterval = 1;
    {
      intervalRatioWaited = 1;
      assertResultingInterval(minimal * 2);

      intervalRatioWaited = 0.75;
      assertResultingInterval(minimal * 1.75);

      intervalRatioWaited = 3;
      assertResultingInterval(minimal * 2);
    }

    minimalRatioInterval = 2;
    {
      intervalRatioWaited = 1;
      assertResultingInterval(minimal * 4);

      intervalRatioWaited = 0.75;
      assertResultingInterval(minimal * 3.5);

      intervalRatioWaited = 3;
      assertResultingInterval(minimal * 4);
    }
  }
});