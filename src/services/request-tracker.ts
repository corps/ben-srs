import {GlobalAction, IgnoredSideEffect, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {AjaxConfig, RequestAjax} from "kamo-reducers/services/ajax";

export interface RequestStarted {
  type: "request-started"
  name: string[]
  config: AjaxConfig
}

export function requestStarted(name: string[], config: AjaxConfig): RequestStarted {
  return {type: "request-started", name, config};
}

export function withRequestTracking(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      subscription.add(effect$.subscribe((effect: RequestAjax | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-ajax":
            dispatch(requestStarted(effect.name, effect.config));
            break;
        }
      }));

      return subscription.unsubscribe;
    }
  };
}