import {State} from "../state";
import {IgnoredAction, ReductionWithEffect} from "kamo-reducers/reducers";
import {CompleteRequest} from "kamo-reducers/services/ajax";
import {RequestStarted} from "../services/request-tracker";
import {WorkCanceled, WorkComplete} from "kamo-reducers/services/workers";

export function withUpdatedAwaiting(state: State, active: boolean, ...items: string[]): ReductionWithEffect<State> {
  let original = state;

  for (let item of items) {
    let index = state.awaiting.indexOf(item);
    if (index !== -1) {
      if (!active) {
        if (state === original) {
          state = {...state};
          state.awaiting = state.awaiting.slice();
        }
        state.awaiting.splice(index, 1);
      }
    }
    else {
      if (active) {
        if (state === original) {
          state = {...state};
          state.awaiting = state.awaiting.slice();
        }
        state.awaiting.push(item);
      }
    }
  }

  return {state};
}

export function reduceAwaiting(state: State,
                               action: CompleteRequest |
                                   RequestStarted |
                                   WorkComplete |
                                   IgnoredAction |
                                   WorkCanceled): ReductionWithEffect<State> {
  switch (action.type) {
    case "complete-request":
    case "work-complete":
    case "work-canceled":
      return withUpdatedAwaiting(state, false, action.name.join("-"));

    case "request-started":
      return withUpdatedAwaiting(state, true, action.name.join("-"));
  }

  return {state};
}
