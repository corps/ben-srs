import {useCallback, useEffect} from "react";

export function useKeypresses(cb: (key: string) => void, deps: any[]) {
  const handler = useCallback((e: KeyboardEvent) => {
    cb(e.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    window.addEventListener('keypress', handler);
    return () => window.removeEventListener('keypress', handler);
  })
}