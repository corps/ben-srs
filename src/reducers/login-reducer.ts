import {State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {LoadLocalData} from "../services/local-storage";
import {AuthAction, requestLogin} from "../services/login";
import {StoredSettings, localSettingsDataKey} from "./local-store-reducer";

export interface ClickLogin {
  type: "click-login"
}

export const clickLogin: ClickLogin = {type: "click-login"};

export type LoginAction = LoadLocalData | ClickLogin | AuthAction;

export function reduceUser(state: State, action: LoginAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "auth-success":
      state = {...state};
      state.loggedIn = true;
      break;

    case "click-login":
      effect = sequence(effect, requestLogin);
      break;

    case "load-local-data":
      if (action.key !== localSettingsDataKey) break;

      state = {...state};

      if (action.data) {
        let storedSettings = action.data as StoredSettings;
        let localSettings = storedSettings.localSettings;
        if (localSettings.session.sessionExpiresAt > Date.now()) {
          state.loggedIn = true;
          break;
        }
      }

      state.loggedIn = false;
      break;
  }

  return {state, effect};
}

