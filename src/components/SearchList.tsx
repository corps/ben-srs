import React, {PropsWithChildren, ReactElement, useCallback} from 'react';
import {IndexIterator} from "../utils/indexable";
import {usePagination} from "../hooks/usePagination";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {useWithKeybinding} from "../hooks/useWithKeybinding";

interface Props {
  iterator: IndexIterator<ReactElement>,
  perPage?: number,
  onReturn: () => void,
}

export function SearchList({iterator, perPage = 15, children, onReturn}: PropsWithChildren<Props>) {
  const {nextPage, data, prevPage, hasMore, page} = usePagination(iterator, perPage);

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

    <div className="mt3">
      {data.map((row, idx) =>
        <div key={idx + ""} className="break-word truncate pv1 ph2 mv2 bl bb pointer b--light-gray">
          {row}
        </div>)}
    </div>
  </div>
}