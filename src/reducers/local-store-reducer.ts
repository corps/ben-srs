import {initialState, State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {LocalSettings, newLocalSettings} from "../model";
import {LoadLocalData, requestLocalData} from "../services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction} from "../services/login";

export const localSettingsDataKey = "settings";

export type LocalStoreAction = WindowFocus | LoadLocalData | Initialization | AuthAction;

export function reduceLocalStore(state: State, action: LocalStoreAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
    case "window-focus":
      effect = sequence(effect, requestLocalData(localSettingsDataKey));
      break;

    case "load-local-data":
      if (action.key !== localSettingsDataKey) break;

      state = {...state};
      state.indexes = initialState.indexes;

      if (action.data) {
        state.localSettings = action.data as LocalSettings;
      } else {
        state.localSettings = newLocalSettings;
      }

      break;
  }

  return {state, effect};
}

