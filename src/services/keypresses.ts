import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";

export interface Keypress {
  type: "keypress"
  key: string
}

export function keypress(key: string): Keypress {
  return {type: "keypress", key};
}

export function withKeyPresses(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      function handler(e: KeyboardEvent) {
        if (e.defaultPrevented) return;
        dispatch(keypress(e.key));
      }

      window.addEventListener("keypress", handler);
      subscription.add(() => window.removeEventListener("keypress", handler));

      return subscription.unsubscribe;
    }
  };
}
