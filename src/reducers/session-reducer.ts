import {initialState, State} from "../state";
import {
  IgnoredAction,
  ReductionWithEffect,
  SideEffect,
} from "kamo-reducers/reducers";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {newSettings, NormalizedNote} from "../storage";
import {
  LoadLocalData,
  requestLocalData,
  storeLocalData,
  cancelLocalLoad,
  clearLocalData,
} from "kamo-reducers/services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction, checkLoginSession, requestLogin} from "../services/login";
import {Indexable, indexesInitialState, NoteTree} from "../indexes";
import {clearOtherSyncProcesses, startSync} from "./sync-reducer";
import {
  cancelWork,
  requestWork,
  WorkComplete,
  WorkCanceled,
} from "kamo-reducers/services/workers";
import {requestFileList} from "../services/files";
import {optimizeSelectedLanguage} from "./main-menu-reducer";

export const settingsStoreKey = "settings";

export interface ClickLogin {
  type: "click-login";
}

export const clickLogin: ClickLogin = {type: "click-login"};

export interface ClickLogout {
  type: "click-logout";
}

export const clickLogout: ClickLogout = {type: "click-logout"};

export type SessionActions =
  | WindowFocus
  | LoadLocalData
  | Initialization
  | WorkComplete
  | WorkCanceled
  | ClickLogin
  | ClickLogout
  | AuthAction;

export const loadIndexesWorkerName = "load-indexes";

export function reduceSession(
  state: State,
  action: SessionActions | IgnoredAction
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "initialization":
    case "window-focus":
      state = {...state};
      state.now = action.when;

      if (
        action.type !== "window-focus" ||
        state.lastWindowVisible < state.now - 15 * 60 * 1000
      ) {
        ({state, effect} = sequenceReduction(
          effect,
          clearOtherSyncProcesses(state)
        ));

        state.indexesReady = false;
        state.authReady = false;

        state.clearSyncEffects = cancelLocalLoad(settingsStoreKey);
        effect = sequence(effect, requestLocalData(settingsStoreKey));

        state.awaiting = {...state.awaiting};
        state.awaiting["file-list"] = 1;
        effect = sequence(effect, requestFileList());
      }

      break;

    case "load-local-data":
      if (action.key !== settingsStoreKey) break;

      ({state, effect} = sequenceReduction(
        effect,
        clearOtherSyncProcesses(state)
      ));

      state = {...state};
      state.indexes = initialState.indexes;

      let data = (action.data as LocalStore) || newLocalStore;
      state.settings = data.settings;
      state.newNotes = data.newNotes;
      state.downloadedNotes = data.downloadedNotes;
      state.loadingIndexable = data.indexables;

      state.awaiting = {...state.awaiting};
      state.awaiting["auth"] = 1;

      effect = sequence(effect, checkLoginSession);
      break;

    case "auth-success":
      state = {...state};

      if (
        state.settings.session.login &&
        state.settings.session.login !== action.login
      ) {
        effect = sequence(effect, clearLocalData);
        state.loadingIndexable = null;
        state.settings = newSettings;
        state.location = "main";
      }

      state.settings = {...state.settings};
      state.settings.session = {...state.settings.session};

      state.settings.session.login = action.login;
      state.settings.session.accessToken = action.accessToken;
      state.settings.session.sessionExpiresAt = action.expires;

      effect = sequence(effect, requestLocalStoreUpdate(state));
      break;

    case "auth-initialized":
      state = {...state};
      state.awaiting = {...state.awaiting};
      state.awaiting["auth"] = 0;
      state.awaiting["work"] = 1;

      state.authReady = true;

      state.clearSyncEffects = cancelWork([loadIndexesWorkerName]);
      effect = sequence(
        effect,
        requestWork([loadIndexesWorkerName], state.loadingIndexable)
      );
      break;

    case "work-complete":
      if (action.name[0] !== loadIndexesWorkerName) break;
      state = {...state};

      let loadedIndexes = action.result as typeof indexesInitialState;
      state.indexes = loadedIndexes;
      state.indexesReady = true;

      ({state, effect} = sequenceReduction(effect, optimizeSelectedLanguage(state)));
      ({state, effect} = sequenceReduction(effect, startSync(state)));
    // deliberate fall through

    case "work-canceled":
      if (action.name[0] !== loadIndexesWorkerName) break;
      state = {...state};
      state.awaiting = {...state.awaiting};
      state.awaiting["work"] = 0;
      break;

    case "click-login":
      effect = sequence(effect, requestLogin);
      // const localStore = require("/Users/zachcollins/Downloads/console (1).json");
      // const myEffect = storeLocalData(settingsStoreKey, localStore);
      // effect = sequence(effect, myEffect);
      break;

    case "click-logout":
      ({state, effect} = sequenceReduction(
        effect,
        clearOtherSyncProcesses(state)
      ));
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
    localStore.indexables = {
      storedFiles: state.indexes.storedFiles.byId.map(k => k[1]),
      notes: state.indexes.notes.byId.map(k => k[1]),
      terms: state.indexes.terms.byNoteIdReferenceAndMarker.map(k => k[1]),
      clozes: state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx.map(
        k => k[1]
      ),
      clozeAnswers: state.indexes.clozeAnswers.byLanguageAndAnswered.map(
        k => k[1]
      ),
    };
  } else {
    localStore.indexables = state.loadingIndexable;
  }

  localStore.newNotes = state.newNotes;
  localStore.downloadedNotes = state.downloadedNotes;
  return storeLocalData(settingsStoreKey, localStore);
}

export const newLocalStore = {
  settings: newSettings,
  indexables: {} as Indexable,
  newNotes: {} as {[k: string]: NormalizedNote},
  downloadedNotes: [] as NoteTree[],
};

export type LocalStore = typeof newLocalStore;
