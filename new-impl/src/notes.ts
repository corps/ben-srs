import {Answer, newSchedule} from "./scheduler";
import {IndexedTable} from "./utils/indexable";
import {mapSome, Maybe} from "./utils/maybe";

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

const notesIndex = new IndexedTable((v: Note) => [v.id] as [string], {})
    .addIndex({byAudioFileId: 0}, ({id, attributes: {audioFileId}}) => [audioFileId] as [string])
    .addIndex({byLanguage: 0}, ({id, attributes: {language}}) => [language] as [string]);

const termsIndex = new IndexedTable((v: Term) => [v.noteId, v.attributes.reference, v.attributes.marker] as [string, string, string], {})
    .addIndex({byLanguage: 0}, ({language}) => [language] as [string])

const clozesIndex = new IndexedTable((v: Cloze) => [v.noteId, v.reference, v.marker, v.clozeIdx] as [string, string, string, number], {})
  .addIndex({byLanguageSpokenAndNextDue: 0}, ({language, attributes: {type, schedule: {delayIntervalMinutes, nextDueMinutes}}}) => [language, type === "listen" || type === "speak", !delayIntervalMinutes, nextDueMinutes] as [string, boolean, boolean, number])
  .addIndex({byLanguageSpokenNewAndNextDue: 0}, ({language, attributes: {type, schedule: {isNew, delayIntervalMinutes, nextDueMinutes}}}) => [language, type === "listen" || type === "speak", isNew, !delayIntervalMinutes, nextDueMinutes] as [string, boolean, boolean, boolean, number])
  .addIndex({byNextDue: 0}, ({attributes: {schedule: {nextDueMinutes, delayIntervalMinutes}}}) => [!delayIntervalMinutes, nextDueMinutes] as [boolean, number]);

const clozeAnswerIndex = new IndexedTable((v: ClozeAnswer) => [v.noteId, v.reference, v.marker, v.clozeIdx, v.answerIdx > 0 ? 1 : 0] as [string, string, string, number, number], {})
  .addIndex({byLanguageAndAnswered: 0}, ({language, answer}) => [language, answer[0]])


export const defaultNoteTree = {
  note: newNote,
  terms: [] as Term[],
  clozes: [] as Cloze[],
  clozeAnswers: [] as ClozeAnswer[],
}

export type NoteTree = typeof defaultNoteTree;

export class NotesIndex {
  public notesIndex = notesIndex.dup();
  public termsIndex = termsIndex.dup();
  public clozesIndex = clozesIndex.dup();
  public clozeAnswerIndex = clozeAnswerIndex.dup();

  findNoteTree(noteId: string): Maybe<NoteTree> {
    const note = this.notesIndex.pkIndex.find([noteId]);
    return mapSome(note, note => {

      return {
        note,
        terms: this.termsIndex.pkIndex.sliceMatching([note.id], [note.id, Infinity]),
        clozes: this.clozesIndex.pkIndex.sliceMatching([note.id], [note.id, Infinity]),
        clozeAnswers: this.clozeAnswerIndex.pkIndex.sliceMatching([note.id], [note.id, Infinity]),
      }
    })
  }
}


export function normalizedNote(noteTree: NoteTree): NormalizedNote {
  let {note, terms, clozes, clozeAnswers} = noteTree;

  const normalizedNote: NormalizedNote = {
    ...note,
    attributes: {
      ...note.attributes,
      terms: [] as NormalizedTerm[],
    },
    id: undefined as void,
    version: undefined as void,
    path: undefined as void,
  };

  let idxOfClozes = 0;
  let idxOfAnswers = 0;
  for (let term of terms) {
    const normalizedTerm: NormalizedTerm = {
      ...term,
      attributes: {
        ...term.attributes,
        clozes: [] as NormalizedCloze[],
      },
      noteId: undefined as void,
      language: undefined as void,
    };

    normalizedNote.attributes.terms.push(normalizedTerm);

    for (; idxOfClozes < clozes.length; ++idxOfClozes) {
      const cloze = clozes[idxOfClozes];
      if (
          cloze.reference !== term.attributes.reference ||
          cloze.marker !== term.attributes.marker ||
          cloze.noteId !== term.noteId
      ) {
        break;
      }

      let normalizedCloze: NormalizedCloze = {
        ...cloze,
        attributes: {
          ...cloze.attributes,
          answers: [],
        },
        noteId: undefined as void,
        reference: undefined as void,
        marker: undefined as void,
        clozeIdx: undefined as void,
        language: undefined as void,
      };

      for (; idxOfAnswers < clozeAnswers.length; ++idxOfAnswers) {
        const clozeAnswer = clozeAnswers[idxOfAnswers];

        if (
            clozeAnswer.reference !== cloze.reference ||
            clozeAnswer.marker !== cloze.marker ||
            clozeAnswer.noteId !== cloze.noteId ||
            clozeAnswer.clozeIdx !== cloze.clozeIdx
        ) {
          break;
        }

        normalizedCloze.attributes.answers.push(clozeAnswer.answer);
      }

      normalizedTerm.attributes.clozes.push(normalizedCloze);
    }
  }

  return normalizedNote;
}

export function denormalizedNote(normalizedNote: NormalizedNote, id: string, path: string, version: string): NoteTree {
  const note: Note = {
    ...normalizedNote,
    attributes: {
      ...normalizedNote.attributes,
      terms: undefined as void,
    },
    id,
    path,
    version,
  };

  const terms = [] as Term[];
  const clozes = [] as Cloze[];
  const clozeAnswers = [] as ClozeAnswer[];

  const noteTree: NoteTree = {
    note,
    terms,
    clozes,
    clozeAnswers,
  };

  for (let normalizedTerm of normalizedNote.attributes.terms) {
    const term: Term = {
      ...normalizedTerm,
      attributes: {
        ...normalizedTerm.attributes,
        clozes: undefined as void,
      },
      language: note.attributes.language,
      noteId: note.id,
    };

    terms.push(term);

    for (
        let clozeIdx = 0;
        clozeIdx < normalizedTerm.attributes.clozes.length;
        ++clozeIdx
    ) {
      let normalizedCloze = normalizedTerm.attributes.clozes[clozeIdx];

      let cloze: Cloze = {
        ...normalizedCloze,
        clozeIdx,
        marker: term.attributes.marker,
        reference: term.attributes.reference,
        language: note.attributes.language,
        noteId: note.id,
      };

      clozes.push(cloze);

      for (
          let answerIdx = 0;
          answerIdx < normalizedCloze.attributes.answers.length;
          ++answerIdx
      ) {
        let normalizedClozeAnswer =
            normalizedCloze.attributes.answers[answerIdx];

        let clozeAnswer: ClozeAnswer = {
          answer: normalizedClozeAnswer,
          answerIdx,
          clozeIdx,
          marker: term.attributes.marker,
          reference: term.attributes.reference,
          language: note.attributes.language,
          noteId: note.id,
        };

        clozeAnswers.push(clozeAnswer);
      }
    }
  }

  return noteTree;
}
