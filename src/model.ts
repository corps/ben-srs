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
  lastAnsweredMinutes: 0,
  nextDueMinutes: 0,
  intervalMinutes: 0,
  isNew: false
};

export type Schedule = typeof newSchedule;

export const newPronunciationOverrides = {} as { [k: string]: string };

export type PronunciationOverrides = typeof newPronunciationOverrides;

export const newByLangPronunciationOverrides = {} as { [k: string]: PronunciationOverrides };

export type ByLangPronunciationOverrides = typeof newByLangPronunciationOverrides;

export const newNote = {
  // On the note itself
  attributes: {
    content: "",
    language: "" as Language,
    pronounce: newPronunciationOverrides,
    editsComplete: false,
    terms: undefined as Term[] | 0
  },

  id: "",
  path: "",
  version: "",
  localEdits: false,
};

export type Note = typeof newNote;

export const newTerm = {
  noteId: "",
  language: "" as Language,

  attributes: {
    reference: "",
    marker: "",
    pronounce: "",
    definition: "",
    hint: "",
    clozes: undefined as Cloze[] | 0
  }
};

export type Term = typeof newTerm;

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

export const newSettings = {
  pronounce: newByLangPronunciationOverrides,
  session: {
    accessToken: "",
    login: "",
    sessionExpiresAt: 0,
    syncCursor: "",
  }
};

export type Settings = typeof newSettings;

function denormalizeCloze(cloze: Cloze, clozeIdx: number, term: Term, note: Note) {
  cloze.clozeIdx = clozeIdx;
  cloze.marker = term.attributes.marker;
  cloze.reference = term.attributes.reference;
  cloze.language = note.attributes.language;
  cloze.noteId = note.id;
}

function denormalizeTerm(term: Term, note: Note): Cloze[] | 0 {
  let clozes = term.attributes.clozes;

  if (clozes) {
    clozes = clozes.slice();
    term.attributes = {...term.attributes};
    term.attributes.clozes = undefined;

    for (let clozeIdx = 0; clozeIdx < clozes.length; ++clozeIdx) {
      let cloze = clozes[clozeIdx] = {...clozes[clozeIdx]};
      denormalizeCloze(cloze, clozeIdx, term, note);
    }
  }

  term.language = note.attributes.language;
  term.noteId = note.id;

  return clozes;
}

export function denormalizedNote(note: Note): { terms: Term[] | 0, clozes: Cloze[] | 0 } {
  let terms = note.attributes.terms;
  let clozes = [] as Cloze[];

  if (terms) {
    note.attributes = {...note.attributes};
    note.attributes.terms = undefined;
    terms = terms.slice();

    for (let termIdx = 0; termIdx < terms.length; ++termIdx) {
      let term = terms[termIdx] = {...terms[termIdx]};
      let termClozes = denormalizeTerm(term, note);
      if (termClozes) clozes = clozes.concat(termClozes);
    }
  }

  return {terms, clozes};
}

export function normalizedNote(note: Note, terms: Term[], clozes: Cloze[]) {
  note = {...note};
  note.attributes = {...note.attributes};
  note.attributes.terms = [];

  var idxOfClozes = 0;

  for (var term of terms) {
    term = {...term};
    term.attributes = {...term.attributes};
    term.attributes.clozes = [];
    delete term.noteId;
    delete term.language;

    note.attributes.terms.push(term);

    for (; idxOfClozes < clozes.length; ++idxOfClozes) {
      var cloze = clozes[idxOfClozes];
      if (cloze.reference !== term.attributes.reference ||
        cloze.marker !== term.attributes.marker) {
        break;
      }

      cloze = {...cloze};

      delete cloze.noteId;
      delete cloze.marker;
      delete cloze.reference;
      delete cloze.clozeIdx;
      delete cloze.language;

      term.attributes.clozes.push(cloze);
    }
  }

  return note;
}

const divisor = "\n===\n";
export function parseNote(text: string): Note {
  let note = {...newNote};
  note.attributes = {...newNote.attributes};

  let divisorIdx = text.lastIndexOf(divisor);

  if (divisorIdx !== -1) {
    note.attributes = JSON.parse(text.slice(divisorIdx + divisor.length));
    note.attributes.content = text.slice(0, divisorIdx);
  } else {
    note.attributes.content = text;
  }

  return note;
}

export function stringifyNote(note: Note): string {
  return note.attributes.content + divisor + JSON.stringify({...note.attributes, content: undefined}, null, 2);
}
