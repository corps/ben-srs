import {initialState, State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {Cloze, Settings, newSettings, Note, Term, NormalizedNote} from "../model";
import {LoadLocalData, requestLocalData, storeLocalData} from "kamo-reducers/services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction} from "../services/login";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../indexes";
import {AnimationCleared, animationRequest, clearAnimation} from "kamo-reducers/services/animation-frame";
import {withUpdatedAwaiting} from "./awaiting-reducer";
import {clearOtherSyncProcesses, startSync} from "./sync-reducer";

export const localStoreKey = "settings";

export type LocalStoreAction =
  WindowFocus
  | LoadLocalData
  | Initialization
  | AuthAction
  | LoadNextIndexesBatch
  | AnimationCleared;

export const indexesLoadBatchSize = 100;

function getAwaitingLoads(state: State) {
  let result = ["indexes"] as string[];

  for (var i = 0; i < Math.ceil(state.notesToLoad.length / indexesLoadBatchSize); ++i) {
    result.push("indexes-notes-" + i);
  }

  for (i = 0; i < Math.ceil(state.termsToLoad.length / indexesLoadBatchSize); ++i) {
    result.push("indexes-terms-" + i);
  }

  for (i = 0; i < Math.ceil(state.clozesToLoad.length / indexesLoadBatchSize); ++i) {
    result.push("indexes-clozes-" + i);
  }

  return result;
}

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
      effect = sequence(effect, clearAnimation(loadNextIndexesBatchAnimationName));

      let data = action.data as LocalStore || newLocalStore;
      state.settings = data.settings;
      state.newNotes = data.newNotes;

      state.notesToLoad = data.notes;
      state.termsToLoad = data.terms;
      state.clozesToLoad = data.clozes;

      ({state, effect} = sequenceReduction(effect, withUpdatedAwaiting(state, true, ...getAwaitingLoads(state))));

      state.clearSyncEffects = state.clearSyncEffects.concat([clearAnimation(loadNextIndexesBatchAnimationName)]);
      effect = sequence(effect, animationRequest(loadNextIndexesBatch, loadNextIndexesBatchAnimationName));
      break;

    case "auth-success":
      effect = sequence(effect, requestLocalStoreUpdate(state));
      break;

    case "animation-cleared":
      ({state, effect} = sequenceReduction(effect, withUpdatedAwaiting(state, false, ...getAwaitingLoads(state))));
      break;

    case "load-next-indexes-batch":
      ({state, effect} = sequenceReduction(effect, withUpdatedAwaiting(state, false,
        "indexes-notes-" + (Math.ceil(state.notesToLoad.length / indexesLoadBatchSize) - 1),
        "indexes-terms-" + (Math.ceil(state.termsToLoad.length / indexesLoadBatchSize) - 1),
        "indexes-clozes-" + (Math.ceil(state.clozesToLoad.length / indexesLoadBatchSize) - 1),
      )));

      state = {...state};
      state.indexes = {...state.indexes};

      state.notesToLoad = state.notesToLoad.slice();
      state.termsToLoad = state.termsToLoad.slice();
      state.clozesToLoad = state.clozesToLoad.slice();

      let notes = state.notesToLoad.splice(0, 100);
      let terms = state.termsToLoad.splice(0, 100);
      let clozes = state.clozesToLoad.splice(0, 100);


      state.indexes.notes = notesIndexer.update(state.indexes.notes, notes);
      state.indexes.terms = termsIndexer.update(state.indexes.terms, terms);
      state.indexes.clozes = clozesIndexer.update(state.indexes.clozes, clozes);

      if (state.notesToLoad.length || state.termsToLoad.length || state.clozesToLoad.length) {
        effect = sequence(effect, animationRequest(loadNextIndexesBatch, loadNextIndexesBatchAnimationName));
      } else {
        state = {...state};
        state.indexesReady = true;
        ({state, effect} = sequenceReduction(effect, withUpdatedAwaiting(state, false, "indexes")));
        ({state, effect} = sequenceReduction(effect, startSync(state)));
      }
  }

  return {state, effect};
}

export interface LoadNextIndexesBatch { type: "load-next-indexes-batch"
}
export const loadNextIndexesBatch: LoadNextIndexesBatch = {type: "load-next-indexes-batch"};

export const loadNextIndexesBatchAnimationName = "load-next-indexes-batch";

export function requestLocalStoreUpdate(state: { indexes: typeof indexesInitialState, settings: Settings, newNotes: NormalizedNote[] }) {
  let localStore = {...newLocalStore};
  localStore.settings = state.settings;
  localStore.notes = state.indexes.notes.byId.map(k => k[1]);
  localStore.terms = state.indexes.terms.byNoteIdReferenceAndMarker.map(k => k[1]);
  localStore.clozes = state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx.map(k => k[1]);
  localStore.newNotes = state.newNotes;
  return storeLocalData(localStoreKey, localStore);
}

export const newLocalStore = {
  settings: newSettings,
  notes: [] as Note[],
  terms: [] as Term[],
  clozes: [] as Cloze[],
  newNotes: [] as NormalizedNote[],
};

type LocalStore = typeof newLocalStore;