import {delay} from "./delay";
import {AsyncGenerator, runPromise} from "../cancellable";

export async function withRetries<T>(b: () => Promise<T>, isRetryable: (e: any) => number, maxRetries = 5): Promise<T> {
    for (let i = 0; i < maxRetries; ++i) {
        try {
            return await b();
        } catch(e) {
            const retryable = isRetryable(e);
            if (retryable === 0) {
                throw e;
            }

            if (retryable < 0) {
                i -= 1;
            }

            await delay(1000 * (i + 1) ** 2);
        }
    }

    return await b();
}

export function* runAttempts<T>(b: () => Promise<T>, isRetryable: (e: any) => number, maxRetries = 5): AsyncGenerator<T, any> {
    for (let i = 0; i < maxRetries; ++i) {
        try {
            return yield* runPromise(b());
        } catch(e) {
            const retryable = isRetryable(e);
            if (retryable === 0) {
                throw e;
            }

            if (retryable < 0) {
                i -= 1;
            }

            yield delay(1000 * (i + 1) ** 2);
        }
    }


    return yield* runPromise(b());
}
