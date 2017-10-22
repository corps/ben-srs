import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {GlobalAction, SideEffect} from "kamo-reducers/reducers";

export interface Initialization {
  type: "initialization"
  when: number
}

export function initialization(when = Date.now()): Initialization {
  return {
    type: "initialization",
    when,
  };
}

export function withInitialization(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();
      dispatch(initialization());
      return subscription.unsubscribe;
    }
  };
}
