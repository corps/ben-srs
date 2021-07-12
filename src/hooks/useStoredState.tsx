import {Dispatch, useCallback, useState} from "react";

export function useStoredState(storage: Storage, key: string, d: string) {
  const [value, setValue] = useState(() => storage.getItem(key) || d);
  const updateValue = useCallback((v: string) => {
    storage.setItem(key, v);
    setValue(v);
  }, [key, storage]);
  return [value, updateValue] as [string, Dispatch<string>];
}