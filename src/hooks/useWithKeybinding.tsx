import React from 'react';
import {useKeypresses} from "./useKeypress";
import {FC, PropsWithChildren, useCallback, useMemo} from "react";

export function useWithKeybinding(key: string, cb: ((wasKey?: boolean) => void) | null | undefined) {
  const keypressCb = useCallback((k: string) => {
    if (k === key && cb) {
      cb(true)
    }
  }, [cb, key])

  const Wrapper = useMemo(() => function KeyWrapper({children}: PropsWithChildren<{}>) {
    return <span className="dib tc">
      <span className="ml1 ttu tracked dib-ns dn f7 white bg-gray br dib">
        ({key})
      </span><br/>
      {children}
    </span>
  }, [key]);

  useKeypresses(keypressCb, [keypressCb])

  return [Wrapper, cb] as [FC<{}>, () => void];
}