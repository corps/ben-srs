import {useState, useEffect} from 'react';
import {Maybe, some} from "./utils/maybe";

export function useCancelledOnDismount() {
  const [cancellable, _] = useState(() => new Cancellable());
  useEffect(() => cancellable.cancel());
  return cancellable;
}

export class Cancellable {
  public cancel: () => void = () => {};
  private cancelledPromise: Promise<{result: Maybe<any>, cancelled?: true}> = new Promise((resolve ,reject) => {
    this.cancel = () => resolve({cancelled: true, result: null});
  })

  race<T>(promise: Promise<T>): Promise<{result: Maybe<T>, cancelled?: true}> {
    return Promise.race([
      promise.then(result => ({result: some(result)})),
      this.cancelledPromise,
    ]);
  }
}