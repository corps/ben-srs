import {Answer} from "./scheduler";
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
export const allLanguages: Language[] = Object.keys(LanguageSettings) as any[];

export const newSchedule = {
  lastAnsweredMinutes: 0,
  nextDueMinutes: 0,
  intervalMinutes: 0,
  isNew: true
};

export type Schedule = typeof newSchedule;

export const newPronunciationOverrides = {} as { [k: string]: string };

export type PronunciationOverrides = typeof newPronunciationOverrides;

export const newByLangPronunciationOverrides = {} as { [k: string]: PronunciationOverrides };

export type ByLangPronunciationOverrides = typeof newByLangPronunciationOverrides;

export const newNote = {
  attributes: {
    content: "This would be new note",
    language: "" as Language,
    editsComplete: false,
    terms: undefined as void,
  },

  id: "",
  path: "",
  version: "",
  localEdits: false,
  hasConflicts: false,
};

export type Note = typeof newNote;

export const newNormalizedNote = {
  ...newNote,
  attributes: {
    ...newNote.attributes,
    terms: [] as NormalizedTerm[]
  },
  id: undefined as void,
  path: undefined as void,
  version: undefined as void,
  localEdits: undefined as void,
  hasConflicts: undefined as void,
};

export type NormalizedNote = typeof newNormalizedNote;

export const newTerm = {
  noteId: "",
  language: "" as Language,

  attributes: {
    reference: "",
    marker: "",
    pronounce: "",
    definition: "",
    hint: "",
    clozes: undefined as void,
  }
};

export type Term = typeof newTerm;

export const newNormalizedTerm = {
  ...newTerm,
  attributes: {
    ...newTerm.attributes,
    clozes: [] as NormalizedCloze[]
  },
  noteId: undefined as void,
  language: undefined as void,
};

export type NormalizedTerm = typeof newNormalizedTerm;

export type ClozeType = "produce" | "recognize" | "listen" | "speak"

export const newCloze = {
  noteId: "",
  reference: "",
  marker: "",
  clozeIdx: -1,
  language: "" as Language,

  attributes: {
    type: "produce" as ClozeType,
    clozed: "",
    schedule: newSchedule,
  },
};

export type Cloze = typeof newCloze;

export const newClozeAnswer = {
  noteId: "",
  reference: "",
  marker: "",
  clozeIdx: -1,
  language: "" as Language,
  answerIdx: -1,
  answer: [0, ["d", 0]] as Answer
};

export type ClozeAnswer = typeof newClozeAnswer;

export const newNormalizeCloze = {
  ...newCloze,
  attributes: {
    ...newCloze.attributes,
    answers: [] as Answer[]
  },
  noteId: undefined as void,
  reference: undefined as void,
  marker: undefined as void,
  clozeIdx: undefined as void,
  language: undefined as void
};

export type NormalizedCloze = typeof newNormalizeCloze;

export const newSession = {
  accessToken: "",
  login: "",
  sessionExpiresAt: 0,
  syncCursor: "",
};

export type Session = typeof newSession;

export const newSettings = {
  pronounce: newByLangPronunciationOverrides,
  session: newSession
};

export type Settings = typeof newSettings;

const divisor = "\n===\n";
export function parseNote(text: string): NormalizedNote {
  let note = {...newNormalizedNote};
  note.attributes = {...newNormalizedNote.attributes};

  let divisorIdx = text.lastIndexOf(divisor);

  if (divisorIdx !== -1) {
    note.attributes = JSON.parse(text.slice(divisorIdx + divisor.length));
    note.attributes.content = text.slice(0, divisorIdx);
  } else {
    note.attributes.content = text;
  }

  return note;
}

export function stringifyNote(note: NormalizedNote): string {
  return note.attributes.content + divisor + JSON.stringify({...note.attributes, content: undefined}, null, 2);
}
