import 'regenerator-runtime'
import {Maybe, some} from "./utils/maybe";

export type AsyncGenerator<Result, P> = Generator<Promise<P> | P, Result, P>;

export class Cancellable {
  public cancel: () => void = () => {};
  public cancelled = false;
  private cancelledPromise: Promise<null> = new Promise((resolve, reject) => {
    this.cancel = () => {
      this.cancelled = true;
      resolve(null);
    }
  })

  race<T>(promise: Promise<T>): Promise<Maybe<T>> {
    return Promise.race([
      promise.then(some),
      this.cancelledPromise,
    ]);
  }

  async run<Result, P>(gen: AsyncGenerator<Result, P>): Promise<Maybe<Result>> {
    let value: any = undefined;
    let result: any;
    for (result = gen.next(); !result.done && !this.cancelled; result = gen.next(value)) {
      try {
        value = await this.race(Promise.resolve(result.value));
        if (value) value = value[0];
        else return null;
      } catch (e: any) {
        console.error(e);
        result = gen.throw(e);
      }
    }

    return Promise.resolve(result.value).then(some);
  }
}
export function* runPromise<T>(v: Promise<T>): AsyncGenerator<T, any> {
  const result = yield v;
  return result as T;
}