import {initialState, State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {newSettings, NormalizedNote} from "../model";
import {
  LoadLocalData, requestLocalData, storeLocalData, cancelLocalLoad,
  clearLocalData
} from "kamo-reducers/services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction, checkLoginSession, requestLogin} from "../services/login";
import {Indexable, indexesInitialState, NoteTree} from "../indexes";
import {clearOtherSyncProcesses, startSync} from "./sync-reducer";
import {cancelWork, requestWork, WorkComplete} from "kamo-reducers/services/workers";
import {withUpdatedAwaiting} from "./awaiting-reducer";

export const localStoreKey = "settings";

export interface ClickLogin {
  type: "click-login"
}

export const clickLogin: ClickLogin = {type: "click-login"};

export interface ClickLogout {
  type: "click-logout"
}

export const clickLogout: ClickLogout = {type: "click-logout"};

export type SessionActions =
  WindowFocus
  | LoadLocalData
  | Initialization
  | WorkComplete
  | ClickLogin
  | ClickLogout
  | AuthAction;

export const loadIndexesWorkerName = "load-indexes";

export function reduceSession(state: State, action: SessionActions | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
    case "window-focus":
      ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));

      state = {...state};
      state.indexesReady = false;
      state.authReady = false;

      state.clearSyncEffects = sequence(state.clearSyncEffects, cancelLocalLoad(localStoreKey))
      effect = sequence(effect, requestLocalData(localStoreKey));
      break;

    case "load-local-data":
      if (action.key !== localStoreKey) break;

      ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));

      state = {...state};
      state.indexes = initialState.indexes;

      let data = action.data as LocalStore || newLocalStore;
      state.settings = data.settings;
      state.newNotes = data.newNotes;
      state.downloadedNotes = data.downloadedNotes;
      state.loadingIndexable = data.indexables;

      effect = sequence(effect, checkLoginSession);
      ({state, effect} = sequenceReduction(effect, withUpdatedAwaiting(state, true, "auth")));
      break;

    case "auth-success":
      state = {...state};

      if (state.settings.session.login !== action.login) {
        effect = sequence(effect, clearLocalData);
        state.loadingIndexable = [];
        state.settings = newSettings;
      }

      state.settings = {...state.settings};
      state.settings.session = {...state.settings.session};

      state.settings.session.login = action.login;
      state.settings.session.accessToken = action.accessToken;
      state.settings.session.sessionExpiresAt = action.expires;

      effect = sequence(effect, requestLocalStoreUpdate(state));
      break;

    case "auth-initialized":
      ({state, effect} = sequenceReduction(effect, withUpdatedAwaiting(state, false, "auth")));
      state = {...state};
      state.authReady = true;

      state.clearSyncEffects = sequence(state.clearSyncEffects, cancelWork([loadIndexesWorkerName]));
      effect = sequence(effect, requestWork([loadIndexesWorkerName], state.loadingIndexable));
      break;


    case "work-complete":
      if (action.name[0] !== loadIndexesWorkerName) break;
      state = {...state};

      let loadedIndexes = action.result as typeof indexesInitialState;
      state.indexes = loadedIndexes;
      state.indexesReady = true;

      ({state, effect} = sequenceReduction(effect, startSync(state)));
      break;

    case "click-login":
      effect = sequence(effect, requestLogin);
      break;

    case "click-logout":
      effect = sequence(effect, clearLocalData);
      state = {...state};
      state.settings = newSettings;
      state.authReady = true;
      break;
  }

  return {state, effect};
}

export function requestLocalStoreUpdate(state: State) {
  let localStore = {...newLocalStore};
  localStore.settings = state.settings;

  if (state.indexesReady || !state.loadingIndexable) {
    localStore.indexables = [
      {
        notes: state.indexes.notes.byId.map(k => k[1]),
        terms: state.indexes.terms.byNoteIdReferenceAndMarker.map(k => k[1]),
        clozes: state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx.map(k => k[1]),
        clozeAnswers: state.indexes.clozeAnswers.byLanguageAndAnswered.map(k => k[1]),
      }
    ];
  } else {
    localStore.indexables = state.loadingIndexable;
  }

  localStore.newNotes = state.newNotes;
  localStore.downloadedNotes = state.downloadedNotes;
  return storeLocalData(localStoreKey, localStore);
}

export const newLocalStore = {
  settings: newSettings,
  indexables: [] as Indexable[],
  newNotes: {} as { [k: string]: NormalizedNote },
  downloadedNotes: [] as NoteTree[],
};

export type LocalStore = typeof newLocalStore;