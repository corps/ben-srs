import {IndexIterator} from "../utils/indexable";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Maybe} from "../utils/maybe";

export function usePagination<V, R>(valueIterator: IndexIterator<V>, perPage: number) {
  const [page, setPage] = useState(0);
  const [pagedData, setPageData] = useState<V[]>([]);
  const [nextValue, setNextValue] = useState(() => null as Maybe<V>);

  useEffect(() => {
    setNextValue(valueIterator());
    setPageData([]);
  }, [valueIterator])

  const requestMore = useCallback(() => {
    let n = nextValue;
    const newPagedData = [...pagedData];
    for (; newPagedData.length < (page + 1) * perPage && n; n = valueIterator()) {
      newPagedData.push(n[0]);
    }

    setPageData(newPagedData);
    setNextValue(n);
  }, [nextValue, page, pagedData, perPage, valueIterator])

  const hasMore = !!nextValue;
  const data = useMemo(() => pagedData.slice(page * perPage, (page + 1) * perPage), [page, pagedData, perPage]);
  const nextPage = useCallback(() => setPage(p => p + 1), []);
  const prevPage = useCallback(() => setPage(p => p - 1), []);

  useEffect(() => {
    if (perPage > 0 && data.length === 0) {
      if (hasMore) requestMore();
      else setPage(0);
    }
  }, [data.length, hasMore, perPage, requestMore])

  return {hasMore, data, nextPage, prevPage, page};
}