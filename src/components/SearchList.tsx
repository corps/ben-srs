import React, {PropsWithChildren, ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {IndexIterator, mapIndexIterator} from "../utils/indexable";
import {usePagination} from "../hooks/usePagination";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {useWithKeybinding} from "../hooks/useWithKeybinding";
import { useKeypresses } from '../hooks/useKeypress';
import { mapSome, Maybe, some, withDefault } from '../utils/maybe';

interface Props {
  iterator: IndexIterator<ReactElement>,
  perPage?: number,
  onReturn: () => void,
}

export function SearchList({iterator, perPage = 15, children, onReturn}: PropsWithChildren<Props>) {
  const [cursorIdx, setCursorIdx] = useState<Maybe<number>>(null);
  useEffect(() => setCursorIdx(null), [iterator]);
  const container = useRef<HTMLDivElement | null>(null);

  const {nextPage, data, prevPage, hasMore, page} = usePagination(iterator, perPage);

  const thisListStartIdx = page * perPage;
  useKeypresses(key => {
    if (key == 'Escape' && cursorIdx) {
      setCursorIdx(null);
      return true;
    }

    if (key == 'ArrowDown' || key == 'j') {
      setCursorIdx(some(withDefault(mapSome(cursorIdx, (i: number) => i + 1), 0)));
      return true;
    }

    if (key == 'ArrowUp' || key == 'k') {
      setCursorIdx(some(withDefault(mapSome(cursorIdx, (i: number) => i - 1), thisListStartIdx + perPage - 1)));
      return true;
    }

    if (key == 'Enter' && cursorIdx && container) {
      const row = container.current?.children.item(cursorIdx[0]);
      if (row instanceof HTMLElement) {
        const focusable = row.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), details:not([disabled]), summary:not(:disabled)');
        if (focusable.length > 0) {
          const f = focusable.item(0);
          if (f instanceof HTMLElement) {
            f.focus();
            f.click();
            return true;
          }
        }
      }
    }

    return false;
  }, [cursorIdx, perPage, thisListStartIdx]);

  useEffect(() => {
    mapSome(cursorIdx, cursorIdx => {
      if (cursorIdx < 0 || cursorIdx >= perPage) setCursorIdx(null);
    })
  }, [cursorIdx, perPage]);

  const [NextWrapper] = useWithKeybinding('ArrowRight', useCallback(() => {
    if (hasMore) nextPage();
  }, [hasMore, nextPage]))

  const [PrevWrapper] = useWithKeybinding('ArrowLeft', useCallback(() => {
    if (page > 0) prevPage();
  }, [page, prevPage]))

  return <div className="mw6 center">
    <div className="tc">
      <WorkflowLinks onReturn={onReturn}/>
      {page > 0 && <SimpleNavLink onClick={prevPage}>
        <PrevWrapper>前</PrevWrapper>
      </SimpleNavLink>}
      {hasMore &&
      <SimpleNavLink onClick={nextPage}>
        <NextWrapper>次</NextWrapper>
      </SimpleNavLink>}
    </div>

    <div className="mt3">
      {children}
    </div>

    <div className="mt3" ref={container}>
      {data.map((row, idx) =>
        <div key={idx + ""} className="break-word truncate pv1 ph2 mv2 bl bb pointer b--light-gray">
          {withDefault(mapSome(cursorIdx, ci => ci == idx), false) ? ">" : null} {row}
        </div>)}
    </div>
  </div>
}
