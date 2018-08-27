import {Indexable, indexesInitialState, NoteTree} from "./indexes";
import {
  StoredFile,
  Language,
  newNormalizedNote,
  newNote,
  newSettings,
  NormalizedNote, Note,
} from "./model";
import {SideEffect} from "kamo-reducers/reducers";
import {SpeechVoice} from "./services/speech";
import {StudyDetails} from "./study";
import {DropboxListFolderResponse} from "./services/dropbox";

export const newStudyData = {
  studied: 0,
  due: 0,
  studyTimeMinutes: 0,
  terms: 0,
  clozes: 0,
  dayBucket: 0,
  remainingInDay: 0,
};

export type StudyData = typeof newStudyData;

export type Location = "main" | "edit-note" | "new-note" | "study" | "search";

export type EditingNoteMode = "select" | "content" | "term";

export type SearchMode = "term" | "term-new" | "content" | "note";
export type SearchResult = ["cloze", StudyDetails] | ["note", Note]

export const initialState = {
  awaiting: {} as { [k: string]: number },

  indexes: indexesInitialState,

  // from local data.
  settings: newSettings,
  newNotes: {} as { [k: string]: NormalizedNote },
  loadingIndexable: null as Indexable | void,
  downloadedNotes: [] as NoteTree[],
  awaitingDownloadNotes: [] as string[],

  inputs: {
    curLanguage: {value: "English" as Language},
    newNoteContent: {value: ""},
    newNoteLanguage: {value: "" as Language | ""},
    newNoteAudioId: {value: ""},

    editingNoteContent: {value: ""},
    editingNoteLanguage: {value: "English" as Language},

    termSearchBy: {value: ""},
    termHint: {value: ""},
    termPronounce: {value: ""},
    termClozes: {value: ""},
    termDefinition: {value: ""},

    searchBar: {value: ""},
    searchMode: {value: "term" as SearchMode},
  },

  toggles: {
    studyByProduce: false,
    studyByRecognize: false,
    studyBySpeak: false,
    studyByListen: false,
    showBack: false,
    studySpoken: false,
  },

  lastWindowVisible: 0,

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
  syncingListFolder: null as DropboxListFolderResponse | void,
  clearSyncEffects: null as SideEffect | void,

  fileNames: [] as string[],
  awaitingDownloadFileIds: [] as string[],
  loadedFiles: false,
  downloadingFileId: null as string | void,

  unusedStoredFiles: [] as StoredFile[],
  searchResults: [] as SearchResult[],
  searchPage: 0,
  searchHasMore: false,
};

export type State = typeof initialState;
export type Inputs = typeof initialState.inputs;
export type Toggles = typeof initialState.toggles;
