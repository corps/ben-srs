import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {AuthAction, requestLogin} from "../services/login";
import {clearLocalData} from "../services/local-storage";
import {newSettings} from "../model";
import {Initialization} from "../services/initialization";
import {addAwaiting, removeAwaiting} from "./awaiting";

export interface ClickLogin {
  type: "click-login"
}

export const clickLogin: ClickLogin = {type: "click-login"};

export type LoginAction = ClickLogin | AuthAction | Initialization;

export function reduceLogin(state: State, action: LoginAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
      state = {...state};
      addAwaiting(state, "auth");
      break;

    case "auth-initialized":
      state = {...state};
      removeAwaiting(state, "auth");
      state.ready = true;
      break;

    case "auth-success":
      state = {...state};

      if (state.settings.session.login !== action.login) {
        effect = sequence(effect, clearLocalData);
        state.settings = newSettings;
      }

      state.settings = {...state.settings};
      state.settings.session = {...state.settings.session};

      state.settings.session.login = action.login;
      state.settings.session.accessToken = action.accessToken;
      state.settings.session.sessionExpiresAt = action.expires;
      break;

    case "click-login":
      effect = sequence(effect, requestLogin);
      break;
  }

  return {state, effect};
}

