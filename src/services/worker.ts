import {LocalStore} from "../reducers/local-store-reducer";
import {indexesInitialState, loadIndexables} from "../indexes";

if (typeof importScripts === 'function') {
  self.onmessage = (ev) => {
    let data = ev.data as LocalStore;
    (self.postMessage as any)(doIndexesLoadingWork(data));
  }
}

export function doIndexesLoadingWork(data: LocalStore): typeof indexesInitialState {
  return loadIndexables(indexesInitialState, data.indexables);
}
