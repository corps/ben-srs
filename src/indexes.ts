import {Index, Indexer} from "redux-indexers";
import {
  Cloze,
  ClozeAnswer,
  NormalizedCloze,
  NormalizedNote,
  NormalizedTerm,
  Note,
  Term,
  StoredFile,
} from "./model";

export type NotesStore = {
  byPath: Index<Note>;
  byId: Index<Note>;
  byLanguage: Index<Note>;
  byHasLocalEdits: Index<Note>;
  byHasConflicts: Index<Note>;
  byEditsComplete: Index<Note>;
  byAudioFileId: Index<Note>;
};

export type StoredFilesStore = {
  byId: Index<StoredFile>;
  byRev: Index<StoredFile>;
};

export type TermsStore = {
  byNoteIdReferenceAndMarker: Index<Term>;
  byLanguage: Index<Term>;
};

export type ClozesStore = {
  byNoteIdReferenceMarkerAndClozeIdx: Index<Cloze>;
  byLanguageSpokenAndNextDue: Index<Cloze>;
  byLanguageSpokenNewAndNextDue: Index<Cloze>;
  byNextDue: Index<Cloze>;
};

export type ClozeAnswersStore = {
  byNoteIdReferenceMarkerClozeIdxAndAnswerIdx: Index<ClozeAnswer>;
  byLanguageAndAnswered: Index<ClozeAnswer>;
  byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx: Index<ClozeAnswer>;
  byLanguageAndLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx: Index<ClozeAnswer>;
};

export const notesIndexer = new Indexer<Note, NotesStore>("byPath");
notesIndexer.addIndex("byPath", note => note.path.split("/"));
notesIndexer.addIndex("byId", note => [note.id]);
notesIndexer.addIndex("byLanguage", note => [note.attributes.language]);
notesIndexer.addIndex("byHasLocalEdits", note => [note.localEdits]);
notesIndexer.addIndex("byHasConflicts", note => [note.hasConflicts]);
notesIndexer.addIndex("byEditsComplete", note => [
  note.attributes.editsComplete,
]);
notesIndexer.addIndex("byAudioFileId", note => [note.attributes.audioFileId]);

export const storedFilesIndexer = new Indexer<StoredFile, StoredFilesStore>(
  "byId"
);
storedFilesIndexer.addIndex("byId", sf => [sf.id]);
storedFilesIndexer.addIndex("byRev", sf => [sf.revision]);

export const termsIndexer = new Indexer<Term, TermsStore>(
  "byNoteIdReferenceAndMarker"
);
termsIndexer.addIndex("byNoteIdReferenceAndMarker", term => [
  term.noteId,
  term.attributes.reference,
  term.attributes.marker,
]);
termsIndexer.addIndex("byLanguage", term => [term.language]);

export const clozesIndexer = new Indexer<Cloze, ClozesStore>(
  "byNoteIdReferenceMarkerAndClozeIdx"
);
clozesIndexer.addIndex("byNoteIdReferenceMarkerAndClozeIdx", cloze => [
  cloze.noteId,
  cloze.reference,
  cloze.marker,
  cloze.clozeIdx,
]);
clozesIndexer.addIndex("byLanguageSpokenAndNextDue", cloze => [
  cloze.language,
  cloze.attributes.type == "listen" || cloze.attributes.type == "speak",
  !cloze.attributes.schedule.delayIntervalMinutes,
  cloze.attributes.schedule.nextDueMinutes,
]);
clozesIndexer.addIndex("byLanguageSpokenNewAndNextDue", cloze => [
  cloze.language,
  cloze.attributes.type == "listen" || cloze.attributes.type == "speak",
  cloze.attributes.schedule.isNew,
  !cloze.attributes.schedule.delayIntervalMinutes,
  cloze.attributes.schedule.nextDueMinutes,
]);

clozesIndexer.addIndex("byNextDue", cloze => [
  !cloze.attributes.schedule.delayIntervalMinutes,
  cloze.attributes.schedule.nextDueMinutes,
]);


export const clozeAnswersIndexer = new Indexer<ClozeAnswer, ClozeAnswersStore>(
  "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx"
);
clozeAnswersIndexer.addIndex(
  "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",
  answer => [
    answer.noteId,
    answer.reference,
    answer.marker,
    answer.clozeIdx,
    answer.answerIdx > 0 ? 1 : 0,
  ]
);
clozeAnswersIndexer.addIndex("byLanguageAndAnswered", answer => [
  answer.language,
  answer.answer[0],
]);
clozeAnswersIndexer.addGroupedIndex(
  "byLanguageAndFirstAnsweredOfNoteIdReferenceMarkerAndClozeIdx",
  answer => [answer.language, answer.answer[0]],
  "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",
  answer => [answer.noteId, answer.reference, answer.marker, answer.clozeIdx],
  (iter, reverseIter) => iter()
);

clozeAnswersIndexer.addGroupedIndex(
  "byLanguageAndLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx",
  answer => [answer.language, answer.answer[0]],
  "byNoteIdReferenceMarkerClozeIdxAndAnswerIdx",
  answer => [answer.noteId, answer.reference, answer.marker, answer.clozeIdx],
  (iter, reverseIter) => reverseIter()
);

export const indexesInitialState = {
  notes: notesIndexer.empty(),
  terms: termsIndexer.empty(),
  clozes: clozesIndexer.empty(),
  clozeAnswers: clozeAnswersIndexer.empty(),
  storedFiles: storedFilesIndexer.empty(),
};

export type SingleIndexable = {
  note?: Note | 0;
  terms?: Term[] | 0;
  clozes?: Cloze[] | 0;
  clozeAnswers?: ClozeAnswer[] | 0;
  notes?: Note[] | 0;
  storedFiles?: StoredFile[] | 0;
};

export interface NoteTree extends SingleIndexable {
  note: Note;
  terms: Term[];
  clozes: Cloze[];
  clozeAnswers: ClozeAnswer[];
}

export type Indexable = SingleIndexable | SingleIndexable[];

export function loadIndexables(indexes: typeof indexesInitialState,
                               indexables: Indexable): typeof indexesInitialState {
  indexes = {...indexes};

  let normalizedIndexable: SingleIndexable[] =
    indexables instanceof Array ? indexables : [indexables];

  for (let indexable of normalizedIndexable) {
    if (indexable.note)
      indexes.notes = notesIndexer.update(indexes.notes, [indexable.note]);
    if (indexable.notes)
      indexes.notes = notesIndexer.update(indexes.notes, indexable.notes);
    if (indexable.terms)
      indexes.terms = termsIndexer.update(indexes.terms, indexable.terms);
    if (indexable.clozes)
      indexes.clozes = clozesIndexer.update(indexes.clozes, indexable.clozes);
    if (indexable.clozeAnswers)
      indexes.clozeAnswers = clozeAnswersIndexer.update(
        indexes.clozeAnswers,
        indexable.clozeAnswers
      );
    if (indexable.storedFiles)
      indexes.storedFiles = storedFilesIndexer.update(
        indexes.storedFiles,
        indexable.storedFiles
      );
  }

  return indexes;
}

export function findNoteTree(indexes: typeof indexesInitialState,
                             id: string): NoteTree | 0 {
  let note = Indexer.getFirstMatching(indexes.notes.byId, [id]);
  if (note) {
    let terms = Indexer.getAllMatching(
      indexes.terms.byNoteIdReferenceAndMarker,
      [id]
    );
    let clozes = Indexer.getAllMatching(
      indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
      [id]
    );
    let clozeAnswers = Indexer.getAllMatching(
      indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx,
      [id]
    );

    return {note, terms, clozes, clozeAnswers};
  }

  return undefined;
}

export function normalizedNote(noteTree: NoteTree): NormalizedNote {
  let {note, terms, clozes, clozeAnswers} = noteTree;

  let normalizedNote: NormalizedNote = {
    ...note,
    attributes: {
      ...note.attributes,
      terms: [] as NormalizedTerm[],
    },
    id: undefined as void,
    version: undefined as void,
    localEdits: undefined as void,
    path: undefined as void,
    hasConflicts: undefined as void,
  };

  var idxOfClozes = 0;
  var idxOfAnswers = 0;
  for (var term of terms) {
    let normalizedTerm: NormalizedTerm = {
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
      var cloze = clozes[idxOfClozes];
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
        let clozeAnswer = clozeAnswers[idxOfAnswers];

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

export function denormalizedNote(normalizedNote: NormalizedNote,
                                 id: string,
                                 path: string,
                                 version: string): NoteTree {
  let note: Note = {
    ...normalizedNote,
    attributes: {
      ...normalizedNote.attributes,
      terms: undefined as void,
    },
    id,
    path,
    version,
    localEdits: false,
    hasConflicts: false,
  };

  let terms = [] as Term[];
  let clozes = [] as Cloze[];
  let clozeAnswers = [] as ClozeAnswer[];

  let noteTree: NoteTree = {
    note,
    terms,
    clozes,
    clozeAnswers,
  };

  for (let normalizedTerm of normalizedNote.attributes.terms) {
    let term: Term = {
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

export function removeNote(indexes: typeof indexesInitialState,
                           note: Note): typeof indexesInitialState {
  indexes = {...indexes};
  indexes.notes = notesIndexer.removeAll(indexes.notes, [note]);

  let terms = Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [
    note.id,
  ]);
  indexes.terms = termsIndexer.removeAll(indexes.terms, terms);

  let clozes = Indexer.getAllMatching(
    indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
    [note.id]
  );
  indexes.clozes = clozesIndexer.removeAll(indexes.clozes, clozes);

  let clozeAnswers = Indexer.getAllMatching(
    indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx,
    [note.id]
  );
  indexes.clozeAnswers = clozeAnswersIndexer.removeAll(
    indexes.clozeAnswers,
    clozeAnswers
  );

  return indexes;
}
