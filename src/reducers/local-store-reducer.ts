import {initialState, State} from "../state";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence} from "kamo-reducers/services/sequence";
import {Cloze, Settings, newSettings, Note, Term} from "../model";
import {LoadLocalData, requestLocalData, storeLocalData} from "../services/local-storage";
import {WindowFocus} from "../services/window";
import {Initialization} from "../services/initialization";
import {AuthAction} from "../services/login";
import {clozesIndexer, indexesInitialState, notesIndexer, termsIndexer} from "../indexes";
import {animationRequest, clearAnimation} from "../services/animation-frame";
import {updateAwaiting} from "./awaiting";

export const localStoreKey = "settings";

export type LocalStoreAction = WindowFocus | LoadLocalData | Initialization | AuthAction | LoadNextIndexesBatch;

export function reduceLocalStore(state: State, action: LocalStoreAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "initialization":
    case "window-focus":
      effect = sequence(effect, requestLocalData(localStoreKey));
      break;

    case "load-local-data":
      if (action.key !== localStoreKey) break;

      state = {...state};
      state.indexes = initialState.indexes;
      effect = sequence(effect, clearAnimation(loadNextIndexesBatchAnimationName));

      let data = action.data as LocalStore || newLocalStore;
      state.settings = data.settings;

      updateAwaiting(state, "notes", !!data.notes.length);
      updateAwaiting(state, "terms", !!data.terms.length);
      updateAwaiting(state, "clozes", !!data.clozes.length);

      effect = sequence(effect, animationRequest(loadNextIndexesBatch(data.notes, data.terms, data.clozes),
        loadNextIndexesBatchAnimationName));
      break;

    case "auth-success":
      effect = sequence(effect, requestLocalStoreUpdate(state));
      break;

    case "load-next-indexes-batch":
      var {notes, terms, clozes} = action;
      state = {...state};
      state.indexes = {...state.indexes};
      state.indexes.notes = notesIndexer.update(state.indexes.notes, notes.slice(0, 100));
      state.indexes.terms = termsIndexer.update(state.indexes.terms, terms.slice(0, 100));
      state.indexes.clozes = clozesIndexer.update(state.indexes.clozes, clozes.slice(0, 100));

      updateAwaiting(state, "notes", !!notes.length);
      updateAwaiting(state, "terms", !!terms.length);
      updateAwaiting(state, "clozes", !!clozes.length);

      if (notes.length || terms.length || clozes.length) {
        let nextLoad = loadNextIndexesBatch(notes.slice(100), terms.slice(100), clozes.slice(100));
        effect = sequence(effect, animationRequest(nextLoad, loadNextIndexesBatchAnimationName));
      }
      break;
  }

  return {state, effect};
}

export interface LoadNextIndexesBatch {
  type: "load-next-indexes-batch",
  notes: Note[],
  terms: Term[],
  clozes: Cloze[]
}

export function loadNextIndexesBatch(notes: Note[], terms: Term[], clozes: Cloze[]): LoadNextIndexesBatch {
  return {
    type: "load-next-indexes-batch",
    notes, terms, clozes
  }
}

export const loadNextIndexesBatchAnimationName = "load-next-indexes-batch";

function requestLocalStoreUpdate(state: { indexes: typeof indexesInitialState, settings: Settings }) {
  let localStore = {...newLocalStore};
  localStore.settings = state.settings;
  localStore.notes = state.indexes.notes.byId.map(k => k[1]);
  localStore.terms = state.indexes.terms.byNoteIdReferenceAndMarker.map(k => k[1]);
  localStore.clozes = state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx.map(k => k[1]);
  return storeLocalData(localStoreKey, localStore);
}

export const newLocalStore = {
  settings: newSettings,
  notes: [] as Note[],
  terms: [] as Term[],
  clozes: [] as Cloze[],
};

type LocalStore = typeof newLocalStore;