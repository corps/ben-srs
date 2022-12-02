import {useCallback, useState} from "react";

export function useStoredState<T>(storage: Storage, key: string, d: T): [T, (t: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(storage.getItem(key) || "") as T;
    } catch {
      return d;
    }
  })
  const updateValue = useCallback((v: T) => {
    storage.setItem(key, JSON.stringify(v));
    setValue(v);
  }, [key, storage]);

  return [value, updateValue];
}