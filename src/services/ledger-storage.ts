import {
  StoreLocalData,
  CancelLocalLoad,
  RequestLocalData,
  ClearLocalData,
  loadLocalData,
} from "kamo-reducers/services/local-storage";
import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {
  SideEffect,
  IgnoredSideEffect,
  GlobalAction,
} from "kamo-reducers/reducers";

import * as jd from "json-delta";

export type LoadedMessage = {key: string; value: any; readSeq: number};
export type LoadRequestMessage = {type: "load"; key: string; readSeq: number};
export type SaveRequestMessage = {type: "save"; key: string; diff: any};
export type ClearRequestMessage = {type: "clear"};
export type Request = LoadRequestMessage | SaveRequestMessage | ClearRequestMessage;

/*
 * https://www.w3.org/TR/IndexedDB/#dfn-mode
 * If multiple READ_WRITE transactions are attempting to access the same object store (i.e. if they have overlapping scope), the transaction that was created first must be the transaction which gets access to the object store first. Due to the requirements in the previous paragraph, this also means that it is the only transaction which has access to the object store until the transaction is finished.
 */

export function withLedgerStorage(
  effect$: Subject<SideEffect>
): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();
      let readSeq = {} as {[k: string]: number};
      let worker: Worker = require("worker-loader!./ledger-worker")();

      subscription.add(() => {
        worker.terminate();
      });

      let savedValues = {} as {[k: string]: any};

      subscription.add(
        effect$.subscribe(
          (
            effect:
              | StoreLocalData
              | CancelLocalLoad
              | RequestLocalData
              | ClearLocalData
              | IgnoredSideEffect
          ) => {
            switch (effect.effectType) {
              case "clear-local-data":
                worker.postMessage({type: "clear"} as ClearRequestMessage);
                break;

              case "store-local-data":
                let cur = savedValues[effect.key];
                savedValues[effect.key] = effect.data;

                worker.postMessage({
                  type: "save",
                  key: effect.key,
                  diff: jd.diff(cur, effect.data as any, 30),
                } as SaveRequestMessage);
                break;

              case "cancel-local-load":
                readSeq[effect.key] = readSeq[effect.key] || 0;
                ++readSeq[effect.key];
                break;

              case "request-local-data":
                readSeq[effect.key] = readSeq[effect.key] || 0;
                worker.postMessage({
                  type: "load",
                  key: effect.key,
                  readSeq: ++readSeq[effect.key],
                } as LoadRequestMessage);
                break;
            }
          }
        )
      );

      worker.onmessage = function(event) {
        let loaded = event.data as LoadedMessage;
        if (readSeq[loaded.key] !== loaded.readSeq) return;
        dispatch(loadLocalData(loaded.key, loaded.value));
      };

      return subscription.unsubscribe;
    },
  };
}
