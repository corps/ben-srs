import React, {PropsWithChildren, ReactElement} from 'react';
import {IndexIterator} from "../utils/indexable";
import {usePagination} from "../hooks/usePagination";
import {SimpleNavLink} from "./SimpleNavLink";

interface Props {
  iterator: IndexIterator<ReactElement>,
  perPage?: number,
  onReturn: () => void,
}

export function SearchList({iterator, perPage = 10, children, onReturn}: PropsWithChildren<Props>) {
  const {nextPage, data, prevPage, hasMore, page} = usePagination(iterator, perPage);

  return <div className="mw6 center">
    <div className="tc">
      <SimpleNavLink onClick={onReturn}>
        戻る
      </SimpleNavLink>
      {page > 0 && <SimpleNavLink onClick={prevPage}>
        前
      </SimpleNavLink>}
      {hasMore &&
      <SimpleNavLink onClick={nextPage}>
        次
      </SimpleNavLink>}
    </div>

    <div className="mt3">
      {children}
    </div>

    <div className="mt3">
      {data.map(row =>
        <div className="break-word truncate pv1 ph2 mv2 bl bb pointer b--light-gray">
          {row}
        </div>)}
    </div>
  </div>
}