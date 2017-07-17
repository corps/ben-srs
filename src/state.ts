import {indexesInitialState} from "./indexes";
import {Cloze, newSettings, Note, Term} from "./model";
import {DropboxListFolderResponse} from "./reducers/sync-reducer";
import {SideEffect} from "kamo-reducers/reducers";

export const initialState = {
  awaiting: [] as string[],
  indexes: indexesInitialState,
  settings: newSettings,
  pathParts: [] as string[],
  now: Date.now(),
  relativeNow: 0,

  authReady: false,
  indexesReady: false,

  notesToLoad: [] as Note[],
  termsToLoad: [] as Term[],
  clozesToLoad: [] as Cloze[],

  syncOffline: false,
  syncAuthBad: false,

  remainingUploads: [] as string[][],

  executingDownloads: [] as string[][],
  downloadedNotes: [] as Note[],
  syncingListFolder: null as DropboxListFolderResponse | 0,
  clearSyncEffects: [] as SideEffect[],
};

export type State = typeof initialState;