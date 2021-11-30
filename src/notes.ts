import {Answer, newSchedule} from "./scheduler";
import {mapSome, Maybe} from "./utils/maybe";
import {endKeyMatchingWithin, Indexed, Indexer} from "./utils/indexable";

export const newNote = {
  attributes: {
    content: "This would be new note",
    language: "",
    editsComplete: false,
    terms: undefined as void,
    audioFileId: null as string | null | undefined,
    tags: [] as string[],
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

export type ClozeType = "produce" | "recognize" | "listen" | "speak" | "flash"

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
    note.attributes = {...note.attributes, ...JSON.parse(text.slice(divisorIdx + divisor.length))};
    note.attributes.content = text.slice(0, divisorIdx);
  } else {
    note.attributes.content = text;
  }

  return note;
}

export function stringifyNote(note: NormalizedNote): string {
  return note.attributes.content + divisor + JSON.stringify({...note.attributes, content: undefined}, null, 2);
}

export type NotesStore = {
  byPath: Indexed<Note>;
  byId: Indexed<Note>;
  byLanguage: Indexed<Note>;
  byAudioFileId: Indexed<Note>;
  byEditsComplete: Indexed<Note>;
};

export type Tagged<T> = {inner: T, tag: string};
function tag<T>(inner: T, tag: string): Tagged<T> {
  return {inner, tag}
}

export type TermsStore = {
  byNoteIdReferenceAndMarker: Indexed<Term>;
};

export type TermsTagStore = {
  byNoteIdReferenceMarkerAndTag: Indexed<Tagged<Term>>;
  byTag: Indexed<Tagged<Term>>
}

export type ClozesStore = {
  byNoteIdReferenceMarkerAndClozeIdx: Indexed<Cloze>;
  byNoteIdReferenceMarkerAndNextDue: Indexed<Cloze>;
};

export type ClozesTagStore = {
  byNoteIdReferenceMarkerClozeIdxAndTag: Indexed<Tagged<Cloze>>;
  byTagSpokenAndNextDue: Indexed<Tagged<Cloze>>;
  byTagSpokenNewAndNextDue: Indexed<Tagged<Cloze>>;
}

export type ClozeAnswersStore = {
  byNoteIdReferenceMarkerClozeIdxAndAnswerIdx: Indexed<ClozeAnswer>;
  byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx: Indexed<ClozeAnswer>;
};

export type ClozeAnswerTagStore = {
  byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag: Indexed<Tagged<ClozeAnswer>>;
  byTagAndAnswered: Indexed<Tagged<ClozeAnswer>>;
}

export type NotesTagStore = {
  byLanguageTagAndNoteId: Indexed<Tagged<Note>>
  byNoteId: Indexed<Tagged<Note>>
  byLangAndTagOfFirstNoteId: Indexed<Tagged<Note>>
}

export const notesTagIndexer = new Indexer<Tagged<Note>, NotesTagStore>("byLanguageTagAndNoteId");
notesTagIndexer.setKeyer("byLanguageTagAndNoteId", ({tag, inner: {attributes: {language}, id}}) => [language, tag, id]);
notesTagIndexer.setKeyer("byNoteId", ({inner: {id}}) => [id]);
notesTagIndexer.addGroupedIndex(
  "byLangAndTagOfFirstNoteId",
  ({tag, inner: {attributes: {language}}}) => [language, tag],
  "byLanguageTagAndNoteId",
  ({tag, inner: {attributes: {language}}}) => [language, tag],
  (iter) => iter()
)

export const notesIndexer = new Indexer<Note, NotesStore>("byPath");
notesIndexer.setKeyer("byPath", note => note.path.split("/"));
notesIndexer.setKeyer("byId", note => [note.id]);
notesIndexer.setKeyer("byLanguage", note => [note.attributes.language]);
notesIndexer.setKeyer("byAudioFileId", note => [note.attributes.audioFileId]);
notesIndexer.setKeyer("byEditsComplete", note => [note.attributes.editsComplete]);

export const termsIndexer = new Indexer<Term, TermsStore>("byNoteIdReferenceAndMarker");
termsIndexer.setKeyer("byNoteIdReferenceAndMarker", term => [
  term.noteId,
  term.attributes.reference,
  term.attributes.marker,
]);

export const termsTagIndexer = new Indexer<Tagged<Term>, TermsTagStore>("byNoteIdReferenceMarkerAndTag");
termsTagIndexer.setKeyer("byNoteIdReferenceMarkerAndTag", ({inner, tag}) => [...termsIndexer.pkKeyer(inner), tag])
termsTagIndexer.setKeyer("byTag", ({inner, tag}) => [tag])


export const clozesIndexer = new Indexer<Cloze, ClozesStore>(
    "byNoteIdReferenceMarkerAndClozeIdx"
);
clozesIndexer.setKeyer("byNoteIdReferenceMarkerAndClozeIdx", cloze => [
  cloze.noteId,
  cloze.reference,
  cloze.marker,
  cloze.clozeIdx,
]);

clozesIndexer.setKeyer("byNoteIdReferenceMarkerAndNextDue", cloze => [
  cloze.noteId,
  cloze.reference,
  cloze.marker,
  cloze.attributes.schedule.nextDueMinutes,
]);

export const clozesTagIndexer = new Indexer<Tagged<Cloze>, ClozesTagStore>("byNoteIdReferenceMarkerClozeIdxAndTag");
clozesTagIndexer.setKeyer("byNoteIdReferenceMarkerClozeIdxAndTag", ({inner, tag}) => [...clozesIndexer.pkKeyer(inner), tag])
clozesTagIndexer.setKeyer("byTagSpokenAndNextDue", ({inner: cloze, tag}) => [
  tag,
  cloze.attributes.type == "listen" || cloze.attributes.type == "speak",
  !cloze.attributes.schedule.delayIntervalMinutes,
  cloze.attributes.schedule.nextDueMinutes,
]);
clozesTagIndexer.setKeyer("byTagSpokenNewAndNextDue", ({inner: cloze, tag}) => [
  tag,
  cloze.attributes.type == "listen" || cloze.attributes.type == "speak",
  cloze.attributes.schedule.isNew,
  !cloze.attributes.schedule.delayIntervalMinutes,
  cloze.attributes.schedule.nextDueMinutes,
]);

export const clozeAnswersIndexer = new Indexer<ClozeAnswer, ClozeAnswersStore>(
    "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx"
);
clozeAnswersIndexer.setKeyer(
    "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",
    answer => [
      answer.noteId,
      answer.reference,
      answer.marker,
      answer.clozeIdx,
      answer.answerIdx > 0 ? 1 : 0,
    ]
);

export const clozeAnswersTagIndexer = new Indexer<Tagged<ClozeAnswer>, ClozeAnswerTagStore>("byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag")
clozeAnswersTagIndexer.setKeyer("byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag", ({inner, tag}) => [...clozeAnswersIndexer.pkKeyer(inner), tag])
clozeAnswersTagIndexer.setKeyer("byTagAndAnswered", ({inner: answer, tag}) => [
  tag,
  answer.answer[0],
]);

clozeAnswersIndexer.addGroupedIndex(
    "byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx",
    answer => [answer.answer[0]],
    "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",
    answer => [answer.noteId, answer.reference, answer.marker, answer.clozeIdx],
    (iter, reverseIter) => reverseIter()
);

export const defaultNoteTree = {
  note: newNote,
  terms: [] as Term[],
  clozes: [] as Cloze[],
  clozeAnswers: [] as ClozeAnswer[],
}

export type NoteTree = typeof defaultNoteTree;

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

export const indexesInitialState = {
  notes: notesIndexer.empty(),
  terms: termsIndexer.empty(),
  clozes: clozesIndexer.empty(),
  clozeAnswers: clozeAnswersIndexer.empty(),

  taggedNotes: notesTagIndexer.empty(),
  taggedTerms: termsTagIndexer.empty(),
  taggedClozes: clozesTagIndexer.empty(),
  taggedClozeAnswers: clozeAnswersTagIndexer.empty(),
};

export type NoteIndexes = typeof indexesInitialState;

export function updateNotes(indexes: NoteIndexes, ...trees: NoteTree[]) {
  const notes: Note[] = [];
  const terms: Term[] = [];
  const clozes: Cloze[] = [];
  const clozeAnswers: ClozeAnswer[] = [];

  const taggedNotes: Tagged<Note>[] = [];
  const taggedTerms: Tagged<Term>[] = [];
  const taggedClozes: Tagged<Cloze>[] = [];
  const taggedClozeAnswer: Tagged<ClozeAnswer>[] = [];

  for (let tree of trees) {
    notes.push(tree.note);
    terms.push(...tree.terms);
    clozes.push(...tree.clozes);
    clozeAnswers.push(...tree.clozeAnswers);

    [tree.note.attributes.language, ...tree.note.attributes.tags].forEach(tagging => {
      taggedNotes.push(tag(tree.note, tagging));
      taggedTerms.push(...tree.terms.map(term => tag(term, tagging)));
      taggedClozes.push(...tree.clozes.map(cloze => tag(cloze, tagging)));
      taggedClozeAnswer.push(...tree.clozeAnswers.map(answer => tag(answer, tagging)));
    })

    indexes.taggedNotes = notesTagIndexer.removeAll(indexes.taggedNotes,
      Indexer.getAllMatching(indexes.taggedNotes.byNoteId, [tree.note.id]));
    indexes.taggedTerms = termsTagIndexer.removeAll(indexes.taggedTerms,
      Indexer.getAllMatching(indexes.taggedTerms.byNoteIdReferenceMarkerAndTag, [tree.note.id]));
    indexes.taggedClozes = clozesTagIndexer.removeAll(indexes.taggedClozes,
      Indexer.getAllMatching(indexes.taggedClozes.byNoteIdReferenceMarkerClozeIdxAndTag, [tree.note.id]));
    indexes.taggedClozeAnswers = clozeAnswersTagIndexer.removeAll(indexes.taggedClozeAnswers,
      Indexer.getAllMatching(indexes.taggedClozeAnswers.byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag, [tree.note.id]));
    indexes.terms = termsIndexer.removeByPk(indexes.terms, [tree.note.id]);
    indexes.clozes = clozesIndexer.removeByPk(indexes.clozes, [tree.note.id]);
    indexes.clozeAnswers = clozeAnswersIndexer.removeByPk(indexes.clozeAnswers, [tree.note.id]);
  }

  indexes.notes = notesIndexer.update(indexes.notes, notes);
  indexes.terms = termsIndexer.update(indexes.terms, terms);
  indexes.clozes = clozesIndexer.update(indexes.clozes, clozes);
  indexes.clozeAnswers = clozeAnswersIndexer.update(indexes.clozeAnswers, clozeAnswers);

  indexes.taggedNotes = notesTagIndexer.update(indexes.taggedNotes, taggedNotes);
  indexes.taggedClozes = clozesTagIndexer.update(indexes.taggedClozes, taggedClozes);
  indexes.taggedTerms = termsTagIndexer.update(indexes.taggedTerms, taggedTerms);
}


export function removeNotesByPath(indexes: NoteIndexes, path: string) {
  const parts = path.split('/');
  const {startIdx, endIdx} = Indexer.getRangeFrom(indexes.notes.byPath, parts, endKeyMatchingWithin(parts))
  const notes = indexes.notes.byPath[1].slice(startIdx, endIdx)
  const noteIds = notes.map(({id}) => id);

  indexes.notes = notesIndexer.removeAll(indexes.notes, notes);
  for (let noteId of noteIds) {
    indexes.taggedNotes = notesTagIndexer.removeAll(indexes.taggedNotes,
      Indexer.getAllMatching(indexes.taggedNotes.byNoteId, [noteId]));
    indexes.taggedTerms = termsTagIndexer.removeAll(indexes.taggedTerms,
      Indexer.getAllMatching(indexes.taggedTerms.byNoteIdReferenceMarkerAndTag, [noteId]));
    indexes.taggedClozes = clozesTagIndexer.removeAll(indexes.taggedClozes,
      Indexer.getAllMatching(indexes.taggedClozes.byNoteIdReferenceMarkerClozeIdxAndTag, [noteId]));
    indexes.taggedClozeAnswers = clozeAnswersTagIndexer.removeAll(indexes.taggedClozeAnswers,
      Indexer.getAllMatching(indexes.taggedClozeAnswers.byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag, [noteId]));

    indexes.terms = termsIndexer.removeAll(indexes.terms, Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [noteId]));
    indexes.clozes = clozesIndexer.removeAll(indexes.clozes, Indexer.getAllMatching(indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [noteId]));
    indexes.clozeAnswers = clozeAnswersIndexer.removeAll(indexes.clozeAnswers, Indexer.getAllMatching(indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx, [noteId]));
  }
}

export function findNoteTree(indexes: NoteIndexes, id: string): Maybe<NoteTree> {
  return mapSome(Indexer.getFirstMatching(indexes.notes.byId, [id]), note => {
      const terms = Indexer.getAllMatching(
          indexes.terms.byNoteIdReferenceAndMarker,
          [id]
      );
      const clozes = Indexer.getAllMatching(
          indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
          [id]
      );
      const clozeAnswers = Indexer.getAllMatching(
          indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx,
          [id]
      );

      return {note, terms, clozes, clozeAnswers};
  });
}
