import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";

export interface WindowFocus {
  type: "window-focus"
  when: number
}

export function windowFocus(when = Date.now()): WindowFocus {
  return { type: "window-focus", when };
}

export function withWindowFocus(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      function handler() {
        dispatch(windowFocus());
      }

      window.addEventListener("focus", handler);
      subscription.add(() => window.removeEventListener("focus", handler));

      return subscription.unsubscribe;
    }
  };
}
