import { useCallback, useState } from 'react';
import { makeSink, State } from './useStateEx';

export function useStoredState<T>(
  storage: Storage,
  key: string,
  d: T
): State<T> {
  const useStored = makeSink<T>(
    useCallback(
      (v: T) => {
        storage.setItem(key, JSON.stringify(v));
      },
      [key, storage]
    )
  );

  return useStored(
    useState<T>(() => {
      try {
        return JSON.parse(storage.getItem(key) || '') as T;
      } catch {
        return d;
      }
    })
  );
}
