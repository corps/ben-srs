import { useEffect, useState } from 'react';
import { AsyncGenerator, Cancellable } from '../cancellable';
import { Maybe, some } from '../utils/maybe';

export function useWithContext(
  fn: (context: Cancellable) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const cancellable = new Cancellable();
    fn(cancellable);
    return () => cancellable.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useAsync<Result>(
  fn: () => AsyncGenerator<Result, any>,
  deps: any[] = [],
  cleanup: () => void = () => null
): [Maybe<Result>, Maybe<any>] {
  const [result, setResult] = useState(null as Maybe<Result>);
  const [error, setError] = useState(null as Maybe<any>);

  useWithContext((context) => {
    setError(null);
    setResult(null);
    try {
      context
        .run(fn())
        .then(setResult, (v) => setError(some(v)))
        .finally(cleanup);
    } catch (e) {
      setError(some(e));
    }
  }, deps);

  return [result, error];
}
