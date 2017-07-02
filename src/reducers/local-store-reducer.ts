import {initialState, State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {Cloze, LocalSettings, newLocalSettings, Note, Term} from "../model";
import {LoadLocalData, requestLocalData, storeLocalData} from "../services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction, requestLogin} from "../services/login";

export const localSettingsDataKey = "settings";
export const loadDenormalizedDebounceName = "load-notes";

export type LocalStoreAction = WindowFocus | LoadLocalData | Initialization | AuthAction;

export function reduceLocalStore(state: State, action: LocalStoreAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;
  let storedSettings: StoredSettings;

  switch (action.type) {
    case "initialization":
    case "window-focus":
      effect = sequence(effect, requestLocalData(localSettingsDataKey));
      break;

    case "auth-success":
      state = {...state};
      state.localSettings = {...state.localSettings};
      let session = state.localSettings.session = {...state.localSettings.session};
      session.accessToken = action.accessToken;
      session.sessionExpiresAt = action.expiresIn + Date.now();

      if (session.login !== action.id) {
        session.login = action.id;
        storedSettings = {
          localSettings: state.localSettings,
          notes: []
        };
        effect = sequence(effect, storeLocalData(localSettingsDataKey, storedSettings));
      }
      break;

    case "load-local-data":
      if (action.key !== localSettingsDataKey) break;

      // Clear state data here.
      // remove all existing stuff in the index.
      state = {...state};
      state.indexes = initialState.indexes;

      // effect = sequence(effect, clearDebounce(loadDenormalizedDebounceName));
      if (action.data) {
        let storedSettings = action.data as StoredSettings;
        let localSettings = storedSettings.localSettings;
        if (localSettings.session.sessionExpiresAt > Date.now()) {
          state.localSettings = localSettings;
          break;
          // load the data into the indexes.
        }
      }

      state.localSettings = newLocalSettings;
      break;
  }

  return {state, effect};
}

export interface Denormalized {
  note: Note,
  terms: Term[]
  clozes: Cloze[]
}

export function denormalize(note: NormalizedNote): Denormalized {
  let terms = [] as Term[];
  let clozes = [] as Cloze[];

  return {
    note: note as Note,
    terms,
    clozes
  }
}

export function normalize(indexes: typeof initialState.indexes): NormalizedNote[] {
  let result = [] as NormalizedNote[];
  //
  // let noteIter = Indexer.iterator(indexes.notes.byId);
  // let termIter = Indexer.iterator(indexes.terms.byNoteIdReferenceAndMarker);
  // let clozeIter = Indexer.iterator(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx);

  return result;
}

export type StoredSettings = {
  localSettings: LocalSettings,
  notes: NormalizedNote[]
}

export interface NormalizedTerm extends Term {
  _normalized: boolean
  clozes: NormalizedCloze[]
}

export interface NormalizedNote extends Note {
  _normalized: boolean
  terms: NormalizedTerm[]
}

export interface NormalizedCloze extends Cloze {
  _normalized: boolean
}
