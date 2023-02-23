import { delay } from './delay';
import { Trigger } from './semaphore';

export class GatingException extends Error {
  constructor(public until: number, public original: any) {
    super();
  }
}

export class DynamicRateLimitQueue {
  private running = 0;
  private gates: number[] = [];

  constructor(private maxConcurrent = 5) {}

  async ungated() {
    const { gates } = this;
    while (gates.length) {
      const next = gates[0];
      if (next > Date.now()) {
        await delay(Date.now() - next);
      } else {
        gates.shift();
      }
    }
  }

  ready<T>(count: number): [Trigger<T>[], Promise<T>[]] {
    const triggers: Trigger<T>[] = [];
    const work: Promise<T>[] = [];

    for (
      let i = this.running;
      i < this.maxConcurrent && triggers.length < count;
      ++i
    ) {
      const trigger = new Trigger<T>();
      this.running += 1;

      work.push(
        trigger.promise
          .finally(() => {
            this.running -= 1;
          })
          .catch((e) => {
            if (e instanceof GatingException) {
              this.gates.push(e.until);
              throw e.original;
            }

            throw e;
          })
      );

      triggers.push(trigger);
    }

    return [triggers, work];
  }
}
