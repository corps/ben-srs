import {delay} from "./delay";
import {Trigger} from "./semaphore";

export class GatingException extends Error {
    constructor(public until: number, public original: any) {
        super();
    }
}


export class DynamicRateLimitQueue {
    private q: Trigger[] = [];
    private running = 0;
    private allowed = 1;
    private gates: number[] = [];

    constructor() {
        this.running = 1;
    }

    async ungated() {
        const {gates} = this;
        while (gates.length) {
            const next = gates[0];
            if (next > Date.now()) {
                await delay(Date.now() - next);
            } else {
                gates.shift();
            }
        }
    }

    async queue<T>(fn: () => Promise<T>): Promise<T> {
        await this.ungated();
        if (this.running < this.allowed) {
            return await this.run(fn);
        }

        const trigger = new Trigger();
        this.q.push(trigger);
        await trigger.promise;

        return await this.queue(fn);
    }

    async run<T>(fn: () => Promise<T>) {
        this.running += 1;
        try {
            const result = await fn();
            this.allowed += 1;
            return result;
        } catch (e) {
            if (e instanceof GatingException) {
                if (this.allowed > 1) this.allowed = 1;
                this.gates.push(e.until);
                throw e.original;
            }

            throw e;
        } finally {
            this.running -= 1;

            if (this.running < this.allowed) {
                const next = this.q.shift();
                if (next) {
                    next.resolve();
                }
            }
        }
    }
}
