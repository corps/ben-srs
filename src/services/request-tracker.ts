import {GlobalAction, IgnoredSideEffect, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {RequestAjax} from "kamo-reducers/services/ajax";
import {RequestWork} from "kamo-reducers/services/workers";

export interface RequestStarted {
  type: "request-started"
  name: string[]
}

export function requestStarted(name: string[]): RequestStarted {
  return {type: "request-started", name};
}

export function withRequestTracking(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      subscription.add(effect$.subscribe((effect: RequestAjax | RequestWork | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-ajax":
            dispatch(requestStarted(effect.name));
            break;

          case "request-work":
            dispatch(requestStarted(effect.name));
            break;
        }
      }));

      return subscription.unsubscribe;
    }
  };
}