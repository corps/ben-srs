import {IndexIterator} from "../utils/indexable";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Maybe} from "../utils/maybe";

type State<V> = {
  page: number,
  pagedData: V[],
  nextValue: Maybe<V>,
}

const defaultState: State<any> = {
  page: 0,
  pagedData: [],
  nextValue: null,
}

function requestMore<V>(valueIterator: IndexIterator<V>, pp: number, {page, pagedData, nextValue}: State<V>) {
  let n = nextValue;
  const newPagedData = [...pagedData];
  for (; newPagedData.length < (page + 1) * pp && n; n = valueIterator()) {
    newPagedData.push(n[0]);
  }

  return {
    page,
    pagedData: newPagedData,
    nextValue: n
  }
}


export function usePagination<V, R>(valueIterator: IndexIterator<V>, perPage: number) {
  const [state, setState] = useState<State<V>>(defaultState)
  const [pp] = useState(perPage);

  useEffect(() => {
    setState(({page}) => requestMore(valueIterator, pp, {
      page,
      pagedData: [],
      nextValue: valueIterator(),
    }))
  }, [pp, valueIterator])

  const hasMore = !!state.nextValue;
  const {page, pagedData} = state;
  const data = useMemo(() => pagedData.slice(page * perPage, (page + 1) * perPage), [page, pagedData, perPage]);
  const nextPage = useCallback(() => {
    setState((v) => requestMore(valueIterator, pp, {...v, page: v.page + 1}))
  }, [pp, valueIterator])
  const prevPage = useCallback(() => {
    setState((v) => requestMore(valueIterator, pp, {...v, page: v.page - 1}))
  }, [pp, valueIterator])

  useEffect(() => {
    if (data.length === 0 && pagedData.length !== 0) {
      setState(state => ({...state, page: 0}))
    }
  }, [data.length, pagedData.length])

  return {hasMore, data, nextPage, prevPage, page};
}