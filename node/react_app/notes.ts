import { Answer, newSchedule } from '../shared/scheduler';

export const newNote = {
  attributes: {
    content: '',
    language: '',
    editsComplete: false,
    studyGuide: false,
    shareAudio: false,
    terms: undefined as void,
    audioFileId: null as string | null | undefined,
    imageFilePaths: null as string[] | null | undefined,
    tags: [] as string[]
  },

  id: '',
  path: '',
  version: ''
};
export type Note = typeof newNote;

export const newDenormalizedNote = {
  ...newNote,
  attributes: {
    ...newNote.attributes,
    terms: [] as DenormalizedTerm[]
  },
  id: undefined as void,
  path: undefined as void,
  version: undefined as void
};

export type DenormalizedNote = typeof newDenormalizedNote;

export const newTerm = {
  noteId: '',
  language: '',

  attributes: {
    reference: '',
    marker: '',
    pronounce: '',
    definition: '',
    hint: '',
    clozes: undefined as void,
    related: undefined as string[] | undefined | null,
    imageFilePaths: null as string[] | null | undefined,
    audioStart: null as number | null | undefined,
    audioEnd: null as number | null | undefined,
    url: null as string | null | undefined
  }
};

export type Term = typeof newTerm;
export const newDenormalizedTerm = {
  ...newTerm,
  attributes: {
    ...newTerm.attributes,
    clozes: [] as DenormalizedCloze[]
  },
  noteId: undefined as void,
  language: undefined as void
};

export type DenormalizedTerm = typeof newDenormalizedTerm;

export type ClozeType = 'produce' | 'recognize' | 'listen' | 'speak' | 'flash';

export const newCloze = {
  noteId: '',
  reference: '',
  marker: '',
  clozeIdx: -1,
  language: '',

  attributes: {
    type: 'produce' as ClozeType,
    clozed: '',
    schedule: newSchedule
  }
};

export type Cloze = typeof newCloze;

export const newClozeAnswer = {
  noteId: '',
  reference: '',
  marker: '',
  clozeIdx: -1,
  language: '',
  answerIdx: -1,
  answer: [0, ['d', 0, 0]] as Answer
};

export type ClozeAnswer = typeof newClozeAnswer;

export const newDenormalizedCloze = {
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

export type DenormalizedCloze = typeof newDenormalizedCloze;

const divisor = '\n===\n';
export function parseNote(text: string): DenormalizedNote {
  let note = { ...newDenormalizedNote };
  note.attributes = { ...newDenormalizedNote.attributes };

  let divisorIdx = text.lastIndexOf(divisor);

  if (divisorIdx !== -1) {
    note.attributes = {
      ...note.attributes,
      ...JSON.parse(text.slice(divisorIdx + divisor.length))
    };
    note.attributes.content = text.slice(0, divisorIdx);
  } else {
    note.attributes.content = text;
  }

  return note;
}

export function stringifyNote(note: DenormalizedNote): string {
  return (
    note.attributes.content +
    divisor +
    JSON.stringify({ ...note.attributes, content: undefined }, null, 2)
  );
}

export const defaultNoteTree = {
  note: newNote,
  terms: [] as Term[],
  clozes: [] as Cloze[],
  clozeAnswers: [] as ClozeAnswer[]
};

export type NoteTree = typeof defaultNoteTree;

export type TermIdentifier = {
  noteId: string;
  reference: string;
  marker: string;
};
