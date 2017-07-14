import {State} from "../state";
import {AjaxConfig, CompleteRequest, requestAjax, RequestAjax} from "kamo-reducers/services/ajax";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {AuthSuccess} from "../services/login";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {sequence} from "kamo-reducers/services/sequence";

export type DropboxAction = AuthSuccess | CompleteRequest | WindowFocus | Initialization;

export function reduceDropbox(state: State, action: DropboxAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "auth-success":
    case "window-focus":
    case "initialization":
      state = {...state};
      if (!state.settings.session.accessToken || (state.now / 1000) > state.settings.session.sessionExpiresAt) {
        state.syncOffline = true;
        break;
      }

      effect = sequence(effect,
          requestListFolder(state.settings.session.accessToken,
              state.settings.session.syncCursor));

      state.syncOffline = false;

      break;

    case "complete-request":
      state = {...state};
      if (action.name[0] === listFolderRequestName) {
        if (!action.success) {
          state.syncOffline = true;
          break;
        }

        let response = JSON.parse(action.response) as ListFolderResponse;
      }
  }

  return {state, effect};
}

export const listFolderRequestName = "list-folder";

export function dropboxBaseHeaders(accessToken: string): AjaxConfig["headers"] {
  return {
    "Authorization": "Bearer " + accessToken
  }
}

export function dropboxApiHeaders(accessToken: string): AjaxConfig["headers"] {
  return {
    ...dropboxBaseHeaders(accessToken),
    "Content-Type": "application/json"
  }
}

export function requestListFolder(accessToken: string, cursor = ""): RequestAjax {
  let config: AjaxConfig = {
    url: "https://api.dropboxapi.com/2/files/list_folder",
    method: "POST",
    headers: dropboxApiHeaders(accessToken),
  };

  config.json = cursor ? {cursor} : {
    recursive: true,
    include_deleted: true
  };

  if (cursor) config.url += "/continue";

  return requestAjax([listFolderRequestName, accessToken, cursor], config);
}

export interface ListUpdate {
  deletionPath?: string
  requestNames: string[][]
}

export interface ListFolderResponse {

}

