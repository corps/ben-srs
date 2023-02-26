import { Dispatch, SetStateAction, useCallback } from 'react';
import { Tuple } from '../../shared/tuple';

export type State<S> = Tuple<S, Dispatch<SetStateAction<S>>>;
export type Rider<S> = (s: State<S>) => State<S>;

export function makeRider<T>(rider: Dispatch<T>): Rider<T> {
  return ([val, setVal]) => {
    const wrappedSetVal = useCallback(
      (v: any) => {
        if (typeof v === 'function') {
          v = v(val);
        }

        setVal(v);
        rider(v);
      },
      [setVal, val]
    );

    return [val, wrappedSetVal];
  };
}
