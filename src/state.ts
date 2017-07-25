import {indexesInitialState} from "./indexes";
import {DenormalizedNoteParts, newSettings, NormalizedNote} from "./model";
import {DropboxListFolderResponse} from "./reducers/sync-reducer";
import {SideEffect} from "kamo-reducers/reducers";

export const initialState = {
  awaiting: [] as string[],

  indexes: indexesInitialState,
  settings: newSettings,
  newNotes: [] as NormalizedNote[],

  pathParts: [] as string[],
  now: Date.now(),
  relativeNow: 0,

  authReady: false,
  indexesReady: false,

  syncOffline: false,
  syncAuthBad: false,

  remainingUploads: [] as string[][],

  executingDownloads: [] as string[][],
  downloadedNotes: [] as DenormalizedNoteParts[],
  syncingListFolder: null as DropboxListFolderResponse | 0,
  clearSyncEffects: [] as SideEffect[],
};

export type State = typeof initialState;