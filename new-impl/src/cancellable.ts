import 'regenerator-runtime'
import {useState, useEffect} from 'react';
import {isSome, mapSome, Maybe, some} from "./utils/maybe";
import {UnbufferedChannel, Trigger} from "./utils/semaphore";

export function useWithContext(fn: (context: Cancellable) => void, deps: any[] = []) {
  useEffect(() => {
    const cancellable = new Cancellable();
    fn(cancellable);
    return () => cancellable.cancel();
  }, deps);
}

export function useAsync<Result>(fn: () => AsyncGenerator<Result, any>, deps: any[] = []) {
  const [resultChannel] = useState(new UnbufferedChannel<Result>());

  useWithContext((context) => {
    context.run(fn()).then((v) => mapSome(v, v => resultChannel.send(v)), e => resultChannel.reject(e));
  }, deps);

  return resultChannel;
}


export type AsyncGenerator<Result, P> = Generator<Promise<P>, Result, P>;

export class Cancellable {
  public cancelled = false;
  public cancel: () => void = () => {};
  private cancelledPromise: Promise<null> = new Promise((resolve ,reject) => {
    this.cancel = () => resolve(null);
  })

  race<T>(promise: Promise<T>): Promise<Maybe<T>> {
    return Promise.race([
      promise.then(some),
      this.cancelledPromise,
    ]);
  }

  async run<Result, P>(gen: AsyncGenerator<Result, P>): Promise<Maybe<Result>> {
    const [innerGen, result] = this.iocRun(gen);

    for (let element of innerGen) {
      await element;
    }

    return result;
  }

  iocRun<Result, P>(gen: AsyncGenerator<Result, P>): [Iterable<Promise<Maybe<P>>>, Promise<Maybe<Result>>] {
    let done = false as boolean | undefined;
    const self = this;

    const yieldChannel = new UnbufferedChannel<Maybe<P>>();
    const pullChannel = new UnbufferedChannel<void>()
    this.cancelledPromise.then(() => {
      pullChannel.close();
    });

    function* iterateYields(): Iterable<Promise<Maybe<P>>> {
      while (!pullChannel.closed) {
        pullChannel.send();
        yield yieldChannel.receive();
      }

      pullChannel.close();
    }


    async function doWork(): Promise<Maybe<Result>> {
      await self.race(pullChannel.receive());
      let next: P = null as any;
      let deferred: Promise<P> | Result;

      try {
        while (!pullChannel.closed) {
          ({value: deferred, done} = gen.next(next));

          if (done) {
            return some(deferred as Result);
          }

          const nextValue = await self.race<P>(deferred as Promise<P>);
          if (isSome(nextValue)) {
            yieldChannel.send(nextValue);
            next = nextValue[0]
          } else {
            break;
          }

          await pullChannel.receive();
        }

        return null;
      } finally {
        yieldChannel.close(null);
        pullChannel.close();
      }
    }

    return [iterateYields(), doWork()];
  }
}

export function* runAsync<T>(fn: () => Promise<T>): AsyncGenerator<T, T> {
  const result = yield fn();
  return result as T;
}

export function* runPromise<T>(v: Promise<T>): AsyncGenerator<T, T> {
  const result = yield v;
  return result as T;
}