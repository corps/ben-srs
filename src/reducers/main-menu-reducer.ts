import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";

export interface VisitMainMenu {
  type: "visit-main-menu"
}

export const visitMainMenu: VisitMainMenu = {type: "visit-main-menu"};

export type MainMenuActions = VisitMainMenu;

export function reduceMainMenu(state: State, action: MainMenuActions | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "visit-main-menu":
      state = {...state};
      state.location = "main";
      break;
  }

  return {state, effect};
}