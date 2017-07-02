export const LanguageSettings = {
  "Japanese": {
    codes: ["ja-JP"],
  },
  "Cantonese": {
    codes: ["yue-Hant-HK", "zh-HK"]
  },
  "English": {
    codes: ["en-US"]
  },
};

export type Language = keyof typeof LanguageSettings;

export const newSchedule = {
  lastAnswered: 0,
  nextDue: 0,
  factor: 0,
  isNew: false
};

export const newPronunciationOverrides = {} as { [k: string]: string };

export type PronunciationOverrides = typeof newPronunciationOverrides;

export const newByLangPronunciationOverrides = {} as { [k: string]: PronunciationOverrides };

export type ByLangPronunciationOverrides = typeof newByLangPronunciationOverrides;

export const newNote = {
  id: "",
  content: "",
  language: "" as Language,
  pronunciationOverrides: newPronunciationOverrides,
  version: "",
  edit: true,
};

export type Note = typeof newNote;

export const newTerm = {
  language: "",
  noteId: "",
  reference: "",
  marker: "",
  pronunciationOverride: "",
  definition: "",
};

export type Term = typeof newTerm;

export const newClozeId = {
  noteId: "",
  reference: "",
  marker: "",
  clozeIdx: -1,
};

export type ClozeId = typeof newClozeId;

export type ClozeType = "produce" | "recall" | "listen" | "speak"

export const newCloze = {
  ...newClozeId,
  ...newSchedule,
  type: "produce" as ClozeType,
  language: "",
};

export type Cloze = typeof newCloze;

export const newLocalSettings = {
  pronunciationOverrides: newByLangPronunciationOverrides,
  session: {
    accessToken: "",
    login: "",
    sessionExpiresAt: 0,
    syncCursor: "",
  }
};

export type LocalSettings = typeof newLocalSettings;

export type ClozeChange = { old: Cloze, next: Cloze, time: number, id: string, type: "cloze-change" };
export type LogEntry = ClozeChange;