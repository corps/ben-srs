import {Dispatch, useCallback, useEffect, useState} from "react";

export function useDebounce(ms: number): (f: Dispatch<void>) => void {
  const [_, setLastHandle] = useState<any>(0);
  useEffect(() => {
    setLastHandle(lastHandle => {
      if(lastHandle) clearTimeout(lastHandle);
      return null;
    });
  }, [ms])
  return useCallback((f: Dispatch<void>) => {
    setLastHandle(lastHandle => {
      if (lastHandle) clearTimeout(lastHandle);
      return setTimeout(f, ms);
    })
  }, [ms]);
}