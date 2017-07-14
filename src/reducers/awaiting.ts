import {State} from "../state";

export function addAwaiting(state: State, item: string) {
  if (state.awaiting.indexOf(item) === -1) {
    state.awaiting = state.awaiting.concat([item]);
  }
}

export function removeAwaiting(state: State, item: string) {
  let index = state.awaiting.indexOf(item);
  if (index !== -1) {
    state.awaiting = state.awaiting.slice();
    state.awaiting.splice(index, 1);
  }
}

export function updateAwaiting(state: State, item: string, active: boolean) {
  if (active) {
    addAwaiting(state, item);
  } else {
    removeAwaiting(state, item);
  }
}