import {initialState, State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {Language, newSettings, NormalizedNote, Note} from "../model";
import {LoadLocalData, requestLocalData, storeLocalData} from "kamo-reducers/services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction} from "../services/login";
import {Indexable, indexesInitialState, NoteTree} from "../indexes";
import {clearOtherSyncProcesses, startSync} from "./sync-reducer";
import {cancelWork, requestWork, WorkComplete} from "kamo-reducers/services/workers";
import {Indexer} from "redux-indexers";

export const localStoreKey = "settings";

export type LocalStoreAction =
  WindowFocus
  | LoadLocalData
  | Initialization
  | WorkComplete
  | AuthAction;

export const loadIndexesWorkerName = "load-indexes";

export function reduceLocalStore(state: State, action: LocalStoreAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
    case "window-focus":
      state = {...state};
      state.indexesReady = false;

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
      state.loadingStore = data;

      state.clearSyncEffects = sequence(state.clearSyncEffects, cancelWork([loadIndexesWorkerName]));
      effect = sequence(effect, requestWork([loadIndexesWorkerName], data));
      break;

    case "auth-success":
      effect = sequence(effect, requestLocalStoreUpdate(state));
      break;

    case "work-complete":
      if (action.name[0] !== loadIndexesWorkerName) break;

      state = {...state};

      let loadedIndexes = action.result as typeof indexesInitialState;
      state.indexes = loadedIndexes;
      state.indexesReady = true;
      state.languages = [];

      let note: Note | 0 = null;
      let language: Language = null;
      while (note = Indexer.iterator(state.indexes.notes.byLanguage, [language, Infinity])()) {
        language = note.attributes.language;
        state.languages.push(language);
      }

      state.inputs = {...state.inputs};

      state.inputs.curLanguage = language;

      ({state, effect} = sequenceReduction(effect, startSync(state)));
  }

  return {state, effect};
}

export function requestLocalStoreUpdate(state: State) {
  let localStore = {...newLocalStore};
  localStore.settings = state.settings;

  if (state.indexesReady || !state.loadingStore) {
    localStore.indexables = [
      {
        notes: state.indexes.notes.byId.map(k => k[1]),
        terms: state.indexes.terms.byNoteIdReferenceAndMarker.map(k => k[1]),
        clozes: state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx.map(k => k[1]),
        clozeAnswers: state.indexes.clozeAnswers.byLanguageAndAnswered.map(k => k[1]),
      }
    ];
  } else {
    localStore.indexables = state.loadingStore.indexables;
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