import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {GlobalAction, SideEffect} from "kamo-reducers/reducers";
import Dropbox = require("dropbox");

export function withDropbox(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      let client = new Dropbox({accessToken: "", clientId: ""});

      return subscription.unsubscribe;
    }
  };
}
