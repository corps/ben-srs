import {useCallback, useEffect} from "react";

export function useKeypresses(cb: (key: string) => void | boolean, deps: any[]) {
  const handler = useCallback((e: KeyboardEvent) => {
    if (e.target && ['INPUT', 'BUTTON', 'TEXTAREA', 'A', 'SPAN', 'BUTTON', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
      if (e.key === 'Escape') (e.target as HTMLElement).blur();
      return;
    }

    let {key} = e;
    if (cb(key)) {
      e.stopImmediatePropagation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  })
}
