import {Answer, newSchedule} from "./scheduler";

export const newNote = {
  attributes: {
    content: "This would be new note",
    language: "",
    editsComplete: false,
    terms: undefined as void,
    audioFileId: null as string | null | undefined,
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
  language: "",

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
  language: "",

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
  language: "",
  answerIdx: -1,
  answer: [0, ["d", 0, 0]] as Answer
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
