import Url from 'url-parse';
import {useMemo} from "react";

export function useQuery() {
  const {query} = useMemo(() => new Url(window.location.href, true), []);
  return query;
}