import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {AuthAction, requestLogin} from "../services/login";
import {clearLocalData, storeLocalData} from "../services/local-storage";
import {newLocalSettings} from "../model";
import {localSettingsDataKey} from "./local-store-reducer";
import {Initialization} from "../services/initialization";

export interface ClickLogin {
  type: "click-login"
}

export const clickLogin: ClickLogin = {type: "click-login"};

export type LoginAction = ClickLogin | AuthAction | Initialization;

export function reduceUser(state: State, action: LoginAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
      state = {...state};
      state.awaitingCount += 1;
      break;

    case "auth-initialized":
      if (!state.ready) {
        state = {...state};
        state.awaitingCount -= 1;
        state.ready = true;
      }
      break;

    case "auth-success":
      state = {...state};

      if (state.localSettings.session.login !== action.login) {
        effect = sequence(effect, clearLocalData);
        state.localSettings = newLocalSettings;
      }

      state.localSettings = {...state.localSettings};
      state.localSettings.session = {...state.localSettings.session};

      state.localSettings.session.login = action.login;
      state.localSettings.session.accessToken = action.accessToken;
      state.localSettings.session.sessionExpiresAt = action.expires;

      effect = sequence(effect, storeLocalData(localSettingsDataKey, state.localSettings));
      break;

    case "click-login":
      effect = sequence(effect, requestLogin);
      break;
  }

  return {state, effect};
}

