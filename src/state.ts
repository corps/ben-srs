import {indexesInitialState, NoteTree} from "./indexes";
import {Language, newSettings, NormalizedNote} from "./model";
import {DropboxListFolderResponse} from "./reducers/sync-reducer";
import {SideEffect} from "kamo-reducers/reducers";
import {LocalStore} from "./reducers/local-store-reducer";

export const initialState = {
  awaiting: [] as string[],

  indexes: indexesInitialState,
  settings: newSettings,
  newNotes: {} as { [k: string]: NormalizedNote },

  curLanguage: "English" as Language,

  pathParts: [] as string[],
  now: Date.now(),
  relativeNow: 0,

  authReady: false,
  indexesReady: false,
  syncOffline: false,
  syncAuthBad: false,

  startedSyncCount: 0,
  finishedSyncCount: 0,

  loadingStore: null as LocalStore,

  remainingUploads: [] as string[][],
  executingDownloads: [] as string[][],
  downloadedNotes: [] as NoteTree[],
  syncingListFolder: null as DropboxListFolderResponse | 0,
  clearSyncEffects: null as SideEffect | 0,
};

export type State = typeof initialState;