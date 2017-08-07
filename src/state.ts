import {Indexable, indexesInitialState, NoteTree} from "./indexes";
import {Language, newSettings, NormalizedNote} from "./model";
import {DropboxListFolderResponse} from "./reducers/sync-reducer";
import {SideEffect} from "kamo-reducers/reducers";

export const newCounts = {
  today: 0,
  week: 0,
  month: 0,
};

export type Counts = typeof newCounts;

export const newStudyData = {
  studied: newCounts,
  due: newCounts,
  studyTimeMinutes: newCounts,
  newStudy: newCounts,
  terms: 0,
  clozes: 0,
};

export type StudyData = typeof newStudyData;


export const initialState = {
  awaiting: [] as string[],

  indexes: indexesInitialState,
  settings: newSettings,
  newNotes: {} as { [k: string]: NormalizedNote },

  inputs: {
    curLanguage: "English" as Language,
  },

  languages: [] as Language[],

  pathParts: [] as string[],
  now: Date.now(),
  relativeNow: 0,
  startOfDayMinutes: 0,
  startOfWeekMinutes: 0,
  startOfMonthMinutes: 0,
  endOfDayMinutes: 0,
  endOfWeekMinutes: 0,
  endOfMonthMinutes: 0,

  studyData: newStudyData,

  authReady: false,
  indexesReady: false,
  syncOffline: false,
  syncAuthBad: false,
  hasEdits: false,

  startedSyncCount: 0,
  finishedSyncCount: 0,

  loadingIndexable: null as Indexable[],

  remainingUploads: [] as string[][],
  executingDownloads: [] as string[][],
  downloadedNotes: [] as NoteTree[],
  syncingListFolder: null as DropboxListFolderResponse | 0,
  clearSyncEffects: null as SideEffect | 0,
};

export type State = typeof initialState;
export type Inputs = typeof initialState.inputs;