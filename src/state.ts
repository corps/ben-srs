import {Indexable, indexesInitialState, NoteTree} from "./indexes";
import {Language, newNormalizedNote, newNote, newSettings, NormalizedNote} from "./model";
import {DropboxListFolderResponse} from "./reducers/sync-reducer";
import {SideEffect} from "kamo-reducers/reducers";
import {SpeechVoice} from "./services/speech";
import {StudyDetails} from "./study";

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

export type Location = "main" | "edit-note" | "new-note" | "study"

export type EditingNoteMode = "select" | "content" | "term"

export const initialState = {
  awaiting: [] as string[],

  indexes: indexesInitialState,
  settings: newSettings,
  newNotes: {} as { [k: string]: NormalizedNote },

  inputs: {
    curLanguage: "English" as Language,
    newNoteContent: "",
    newNoteLanguage: "" as Language,

    editingNoteContent: "",
    editingNoteLanguage: "English" as Language,

    termSearchBy: "",
    termHint: "",
    termPronounce: "",
    termClozes: "",
    termDefinition: "",
  },

  toggles: {
    studyByProduce: false,
    studyByRecognize: false,
    studyBySpeak: false,
    studyByListen: false,
    showBack: false,
  },

  lastWindowVisible: Date.now(),

  studyDetails: null as StudyDetails,
  studyStarted: Date.now(),

  editingNoteMode: "select" as EditingNoteMode,
  editingNote: newNote,
  editingNoteNormalized: newNormalizedNote,
  selectTermLeft: -1,
  editingTermMarker: "",
  editingTermReference: "",

  languages: [] as Language[],
  voices: [] as SpeechVoice[],

  now: Date.now(),
  relativeNow: 0,
  startOfDayMinutes: 0,
  startOfWeekMinutes: 0,
  startOfMonthMinutes: 0,
  endOfDayMinutes: 0,
  endOfWeekMinutes: 0,
  endOfMonthMinutes: 0,

  location: "main" as Location,
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
export type Toggles = typeof initialState.toggles;