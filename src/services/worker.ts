import {Indexable, indexesInitialState, loadIndexables} from "../indexes";

if (typeof importScripts === 'function') {
  self.onmessage = (ev) => {
    let data = ev.data as Indexable[];
    (self.postMessage as any)(doIndexesLoadingWork(data));
  }
}

export function doIndexesLoadingWork(data: Indexable[]): typeof indexesInitialState {
  return loadIndexables(indexesInitialState, data);
}
