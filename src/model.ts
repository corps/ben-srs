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
  isNew: true
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
    editsComplete: false,
    terms: undefined as void,
  },

  id: "",
  path: "",
  version: "",
  localEdits: false,
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
  localEdits: undefined as void
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
    answers: [] as
  },
};

export type Cloze = typeof newCloze;

export const newNormalizeCloze = {
  ...newCloze,
  attributes: {
    ...newCloze.attributes
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

function denormalizeCloze(normalizedCloze: NormalizedCloze, clozeIdx: number, term: Term, note: Note): Cloze {
  return {
    ...normalizedCloze,
    clozeIdx,
    marker: term.attributes.marker,
    reference: term.attributes.reference,
    language: note.attributes.language,
    noteId: note.id
  }
}

function denormalizeTerm(normalizedTerm: NormalizedTerm, note: Note): { clozes: Cloze[], term: Term } {
  let term = {
    ...normalizedTerm,
    attributes: {
      ...normalizedTerm.attributes,
      clozes: undefined as void
    },
    language: note.attributes.language,
    noteId: note.id
  };

  return {
    term: term,
    clozes: normalizedTerm.attributes.clozes.map((c, idx) => denormalizeCloze(c, idx, term, note))
  }
}

export type DenormalizedNoteParts = { note: Note, terms: Term[], clozes: Cloze[] }
export function denormalizedNote(normalizedNote: NormalizedNote,
                                 id: string, path: string,
                                 version: string): DenormalizedNoteParts {
  let note: Note = {
    ...normalizedNote,
    attributes: {
      ...normalizedNote.attributes,
      terms: undefined as void
    },
    id, path, version, localEdits: false
  };

  let clozes = [] as Cloze[];

  let terms = normalizedNote.attributes.terms.map(term => {
    let denormalized = denormalizeTerm(term, note);
    clozes = clozes.concat(denormalized.clozes);
    return denormalized.term;
  });

  return {
    note, terms, clozes
  }
}

export function normalizedNote(note: Note, terms: Term[], clozes: Cloze[]): NormalizedNote {
  let normalizedNote: NormalizedNote = {
    ...note,
    attributes: {
      ...note.attributes,
      terms: [] as NormalizedTerm[]
    },
    id: undefined as void,
    version: undefined as void,
    localEdits: undefined as void,
    path: undefined as void
  };

  var idxOfClozes = 0;
  for (var term of terms) {
    let normalizedTerm: NormalizedTerm = {
      ...term,
      attributes: {
        ...term.attributes,
        clozes: [] as NormalizedCloze[]
      },
      noteId: undefined as void,
      language: undefined as void
    };

    normalizedNote.attributes.terms.push(normalizedTerm);

    for (; idxOfClozes < clozes.length; ++idxOfClozes) {
      var cloze = clozes[idxOfClozes];
      if (cloze.reference !== term.attributes.reference ||
        cloze.marker !== term.attributes.marker) {
        break;
      }

      let normalizedCloze: NormalizedCloze = {
        ...cloze,
        noteId: undefined as void,
        reference: undefined as void,
        marker: undefined as void,
        clozeIdx: undefined as void,
        language: undefined as void,
      };

      normalizedTerm.attributes.clozes.push(normalizedCloze);
    }
  }

  return normalizedNote;
}

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
