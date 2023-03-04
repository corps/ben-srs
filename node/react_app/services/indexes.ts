import { endKeyMatchingWithin, Indexed, Indexer } from '../../shared/indexable';
import { mapSome, Maybe } from '../../shared/maybe';
import {
  Cloze,
  ClozeAnswer,
  DenormalizedNote,
  DenormalizedCloze,
  DenormalizedTerm,
  Note,
  NoteTree,
  Term
} from '../notes';

export type NotesStore = {
  byPath: Indexed<Note>;
  byId: Indexed<Note>;
  byLanguageAndStudyGuide: Indexed<Note>;
  byAudioFileId: Indexed<Note>;
  byEditsComplete: Indexed<Note>;
  byStudyGuideAndLanguage: Indexed<Note>;
};
export type Tagged<T> = { inner: T; tag: string };

function tag<T>(inner: T, tag: string): Tagged<T> {
  return { inner, tag };
}

export type TermsStore = {
  byNoteIdReferenceAndMarker: Indexed<Term>;
  byReference: Indexed<Term>;
};
export type TermsTagStore = {
  byNoteIdReferenceMarkerAndTag: Indexed<Tagged<Term>>;
  byTag: Indexed<Tagged<Term>>;
};
export type ClozesStore = {
  byNoteIdReferenceMarkerAndClozeIdx: Indexed<Cloze>;
  byNoteIdReferenceMarkerAndNextDue: Indexed<Cloze>;
};
export type ClozesTagStore = {
  byNoteIdReferenceMarkerClozeIdxAndTag: Indexed<Tagged<Cloze>>;
  byTagSpokenAndNextDue: Indexed<Tagged<Cloze>>;
  byTagSpokenNewAndNextDue: Indexed<Tagged<Cloze>>;
  byTagSpokenReferenceAndNextDue: Indexed<Tagged<Cloze>>;
};
export type ClozeAnswersStore = {
  byNoteIdReferenceMarkerClozeIdxAndAnswerIdx: Indexed<ClozeAnswer>;
  byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx: Indexed<ClozeAnswer>;
};
export type ClozeAnswerTagStore = {
  byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag: Indexed<Tagged<ClozeAnswer>>;
  byTagAndAnswered: Indexed<Tagged<ClozeAnswer>>;
};
export type NotesTagStore = {
  byLanguageTagAndNoteId: Indexed<Tagged<Note>>;
  byNoteId: Indexed<Tagged<Note>>;
  byLangAndTagOfFirstNoteId: Indexed<Tagged<Note>>;
};
export type TermsRelatableStore = {
  byNoteIdAndReferenceAndMarkerAndRelatable: Indexed<Tagged<Term>>;
  byRelatable: Indexed<Tagged<Term>>;
};
export const notesTagIndexer = new Indexer<Tagged<Note>, NotesTagStore>(
  'byLanguageTagAndNoteId'
);
export const notesIndexer = new Indexer<Note, NotesStore>('byPath');
export const termsIndexer = new Indexer<Term, TermsStore>(
  'byNoteIdReferenceAndMarker'
);
export const termsTagIndexer = new Indexer<Tagged<Term>, TermsTagStore>(
  'byNoteIdReferenceMarkerAndTag'
);
export const termsRelatableIndex = new Indexer<
  Tagged<Term>,
  TermsRelatableStore
>('byNoteIdAndReferenceAndMarkerAndRelatable');
export const clozesIndexer = new Indexer<Cloze, ClozesStore>(
  'byNoteIdReferenceMarkerAndClozeIdx'
);
export const clozesTagIndexer = new Indexer<Tagged<Cloze>, ClozesTagStore>(
  'byNoteIdReferenceMarkerClozeIdxAndTag'
);
export const clozeAnswersIndexer = new Indexer<ClozeAnswer, ClozeAnswersStore>(
  'byNoteIdReferenceMarkerClozeIdxAndAnswerIdx'
);
export const clozeAnswersTagIndexer = new Indexer<
  Tagged<ClozeAnswer>,
  ClozeAnswerTagStore
>('byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag');

notesTagIndexer.setKeyer(
  'byLanguageTagAndNoteId',
  ({
    tag,
    inner: {
      attributes: { language },
      id
    }
  }) => [language, tag, id]
);
notesTagIndexer.setKeyer('byNoteId', ({ inner: { id } }) => [id]);
notesTagIndexer.addGroupedIndex(
  'byLangAndTagOfFirstNoteId',
  ({
    tag,
    inner: {
      attributes: { language }
    }
  }) => [language, tag],
  'byLanguageTagAndNoteId',
  ({
    tag,
    inner: {
      attributes: { language }
    }
  }) => [language, tag],
  (iter) => iter()
);

notesIndexer.setKeyer('byPath', (note) => note.path.split('/'));
notesIndexer.setKeyer('byId', (note) => [note.id]);
notesIndexer.setKeyer('byLanguageAndStudyGuide', (note) => [
  note.attributes.language,
  note.attributes.studyGuide
]);
notesIndexer.setKeyer('byAudioFileId', (note) => [note.attributes.audioFileId]);
notesIndexer.setKeyer('byEditsComplete', (note) => [
  note.attributes.editsComplete
]);

termsIndexer.setKeyer('byNoteIdReferenceAndMarker', (term) => [
  term.noteId,
  term.attributes.reference,
  term.attributes.marker
]);

termsIndexer.setKeyer('byReference', (term) => [term.attributes.reference]);

termsTagIndexer.setKeyer('byNoteIdReferenceMarkerAndTag', ({ inner, tag }) => [
  ...termsIndexer.pkKeyer(inner),
  tag
]);
termsTagIndexer.setKeyer('byTag', ({ inner, tag }) => [tag]);

termsRelatableIndex.setKeyer(
  'byNoteIdAndReferenceAndMarkerAndRelatable',
  ({
    tag,
    inner: {
      attributes: { reference, marker },
      noteId
    }
  }) => [noteId, reference, marker, tag]
);
termsRelatableIndex.setKeyer('byRelatable', ({ tag }) => [tag]);

clozesIndexer.setKeyer('byNoteIdReferenceMarkerAndClozeIdx', (cloze) => [
  cloze.noteId,
  cloze.reference,
  cloze.marker,
  cloze.clozeIdx
]);

clozesIndexer.setKeyer('byNoteIdReferenceMarkerAndNextDue', (cloze) => [
  cloze.noteId,
  cloze.reference,
  cloze.marker,
  cloze.attributes.schedule.nextDueMinutes
]);

clozesIndexer.setKeyer('byNoteIdReferenceMarkerAndNextDue', (cloze) => [
  cloze.noteId,
  cloze.reference,
  cloze.marker,
  cloze.attributes.schedule.nextDueMinutes
]);

clozesTagIndexer.setKeyer(
  'byNoteIdReferenceMarkerClozeIdxAndTag',
  ({ inner, tag }) => [...clozesIndexer.pkKeyer(inner), tag]
);
clozesTagIndexer.setKeyer('byTagSpokenAndNextDue', ({ inner: cloze, tag }) => [
  tag,
  cloze.attributes.type == 'listen' || cloze.attributes.type == 'speak',
  !cloze.attributes.schedule.delayIntervalMinutes,
  cloze.attributes.schedule.nextDueMinutes
]);
clozesTagIndexer.setKeyer(
  'byTagSpokenNewAndNextDue',
  ({ inner: cloze, tag }) => [
    tag,
    cloze.attributes.type == 'listen' || cloze.attributes.type == 'speak',
    cloze.attributes.schedule.isNew,
    !cloze.attributes.schedule.delayIntervalMinutes,
    cloze.attributes.schedule.nextDueMinutes
  ]
);
clozesTagIndexer.setKeyer(
  'byTagSpokenReferenceAndNextDue',
  ({ inner: cloze, tag }) => [
    tag,
    cloze.attributes.type == 'listen' || cloze.attributes.type == 'speak',
    cloze.reference,
    cloze.attributes.schedule.nextDueMinutes
  ]
);

clozeAnswersIndexer.setKeyer(
  'byNoteIdReferenceMarkerClozeIdxAndAnswerIdx',
  (answer) => [
    answer.noteId,
    answer.reference,
    answer.marker,
    answer.clozeIdx,
    answer.answerIdx > 0 ? 1 : 0
  ]
);

clozeAnswersTagIndexer.setKeyer(
  'byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag',
  ({ inner, tag }) => [...clozeAnswersIndexer.pkKeyer(inner), tag]
);
clozeAnswersTagIndexer.setKeyer(
  'byTagAndAnswered',
  ({ inner: answer, tag }) => [tag, answer.answer[0]]
);

clozeAnswersIndexer.addGroupedIndex(
  'byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx',
  (answer) => [answer.answer[0]],
  'byNoteIdReferenceMarkerClozeIdxAndAnswerIdx',
  (answer) => [answer.noteId, answer.reference, answer.marker, answer.clozeIdx],
  (iter, reverseIter) => reverseIter()
);

export const indexesInitialState = {
  notes: notesIndexer.empty(),
  terms: termsIndexer.empty(),
  clozes: clozesIndexer.empty(),
  clozeAnswers: clozeAnswersIndexer.empty(),

  taggedNotes: notesTagIndexer.empty(),
  taggedTerms: termsTagIndexer.empty(),
  taggedClozes: clozesTagIndexer.empty(),
  taggedClozeAnswers: clozeAnswersTagIndexer.empty(),

  termsRelatable: termsRelatableIndex.empty()
};

export type NoteIndexes = typeof indexesInitialState;

export function updateNotes(indexes: NoteIndexes, ...trees: NoteTree[]) {
  const notes: Note[] = [];
  const terms: Term[] = [];
  const clozes: Cloze[] = [];
  const clozeAnswers: ClozeAnswer[] = [];

  const taggedNotes: Tagged<Note>[] = [];
  const taggedTerms: Tagged<Term>[] = [];
  const termsRelatable: Tagged<Term>[] = [];
  const taggedClozes: Tagged<Cloze>[] = [];
  const taggedClozeAnswer: Tagged<ClozeAnswer>[] = [];

  for (let tree of trees) {
    notes.push(tree.note);
    terms.push(...tree.terms);
    clozes.push(...tree.clozes);
    clozeAnswers.push(...tree.clozeAnswers);

    [tree.note.attributes.language, ...tree.note.attributes.tags].forEach(
      (tagging) => {
        taggedNotes.push(tag(tree.note, tagging));
        taggedTerms.push(...tree.terms.map((term) => tag(term, tagging)));
        taggedClozes.push(...tree.clozes.map((cloze) => tag(cloze, tagging)));
        taggedClozeAnswer.push(
          ...tree.clozeAnswers.map((answer) => tag(answer, tagging))
        );
      }
    );

    tree.terms.forEach((term) => {
      term.attributes.related?.forEach((relatable) => {
        termsRelatable.push(tag(term, relatable));
      });
    });

    indexes.taggedNotes = notesTagIndexer.removeAll(
      indexes.taggedNotes,
      Indexer.getAllMatching(indexes.taggedNotes.byNoteId, [tree.note.id])
    );
    indexes.taggedTerms = termsTagIndexer.removeAll(
      indexes.taggedTerms,
      Indexer.getAllMatching(
        indexes.taggedTerms.byNoteIdReferenceMarkerAndTag,
        [tree.note.id]
      )
    );
    indexes.taggedClozes = clozesTagIndexer.removeAll(
      indexes.taggedClozes,
      Indexer.getAllMatching(
        indexes.taggedClozes.byNoteIdReferenceMarkerClozeIdxAndTag,
        [tree.note.id]
      )
    );
    indexes.taggedClozeAnswers = clozeAnswersTagIndexer.removeAll(
      indexes.taggedClozeAnswers,
      Indexer.getAllMatching(
        indexes.taggedClozeAnswers
          .byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag,
        [tree.note.id]
      )
    );
    indexes.terms = termsIndexer.removeByPk(indexes.terms, [tree.note.id]);
    indexes.clozes = clozesIndexer.removeByPk(indexes.clozes, [tree.note.id]);
    indexes.clozeAnswers = clozeAnswersIndexer.removeByPk(
      indexes.clozeAnswers,
      [tree.note.id]
    );
  }

  indexes.notes = notesIndexer.update(indexes.notes, notes);
  indexes.terms = termsIndexer.update(indexes.terms, terms);
  indexes.clozes = clozesIndexer.update(indexes.clozes, clozes);
  indexes.clozeAnswers = clozeAnswersIndexer.update(
    indexes.clozeAnswers,
    clozeAnswers
  );

  indexes.taggedNotes = notesTagIndexer.update(
    indexes.taggedNotes,
    taggedNotes
  );
  indexes.taggedClozes = clozesTagIndexer.update(
    indexes.taggedClozes,
    taggedClozes
  );
  indexes.taggedTerms = termsTagIndexer.update(
    indexes.taggedTerms,
    taggedTerms
  );
  indexes.taggedClozeAnswers = clozeAnswersTagIndexer.update(
    indexes.taggedClozeAnswers,
    taggedClozeAnswer
  );

  indexes.termsRelatable = termsRelatableIndex.update(
    indexes.termsRelatable,
    termsRelatable
  );
}

export function removeNotesByPath(indexes: NoteIndexes, path: string) {
  const parts = path.split('/');
  const { startIdx, endIdx } = Indexer.getRangeFrom(
    indexes.notes.byPath,
    parts,
    endKeyMatchingWithin(parts)
  );
  const notes = indexes.notes.byPath[1].slice(startIdx, endIdx);
  const noteIds = notes.map(({ id }) => id);

  indexes.notes = notesIndexer.removeAll(indexes.notes, notes);
  for (let noteId of noteIds) {
    indexes.taggedNotes = notesTagIndexer.removeAll(
      indexes.taggedNotes,
      Indexer.getAllMatching(indexes.taggedNotes.byNoteId, [noteId])
    );
    indexes.taggedTerms = termsTagIndexer.removeAll(
      indexes.taggedTerms,
      Indexer.getAllMatching(
        indexes.taggedTerms.byNoteIdReferenceMarkerAndTag,
        [noteId]
      )
    );
    indexes.taggedClozes = clozesTagIndexer.removeAll(
      indexes.taggedClozes,
      Indexer.getAllMatching(
        indexes.taggedClozes.byNoteIdReferenceMarkerClozeIdxAndTag,
        [noteId]
      )
    );
    indexes.taggedClozeAnswers = clozeAnswersTagIndexer.removeAll(
      indexes.taggedClozeAnswers,
      Indexer.getAllMatching(
        indexes.taggedClozeAnswers
          .byNoteIdReferenceMarkerClozeIdxAnswerIdxAndTag,
        [noteId]
      )
    );

    indexes.terms = termsIndexer.removeAll(
      indexes.terms,
      Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [noteId])
    );
    indexes.clozes = clozesIndexer.removeAll(
      indexes.clozes,
      Indexer.getAllMatching(
        indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
        [noteId]
      )
    );
    indexes.clozeAnswers = clozeAnswersIndexer.removeAll(
      indexes.clozeAnswers,
      Indexer.getAllMatching(
        indexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx,
        [noteId]
      )
    );
  }
}

export function findNoteTree(
  indexes: NoteIndexes,
  id: string
): Maybe<NoteTree> {
  return mapSome(Indexer.getFirstMatching(indexes.notes.byId, [id]), (note) => {
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

    return { note, terms, clozes, clozeAnswers };
  });
}

export function getLanguagesOfNotes(notes: NotesStore) {
  const languages: string[] = [];
  for (let i = 0; i < notes.byLanguageAndStudyGuide[1].length; ) {
    const {
      attributes: { language }
    } = notes.byLanguageAndStudyGuide[1][i];
    languages.push(language);
    const { endIdx } = Indexer.getRangeFrom(
      notes.byLanguageAndStudyGuide,
      [language],
      endKeyMatchingWithin([language])
    );
    i = endIdx;
  }
  return languages;
}

export function denormalizedNote(noteTree: NoteTree): DenormalizedNote {
  let { note, terms, clozes, clozeAnswers } = noteTree;

  const denormalized: DenormalizedNote = {
    ...note,
    attributes: {
      ...note.attributes,
      terms: [] as DenormalizedTerm[]
    },
    id: undefined as void,
    version: undefined as void,
    path: undefined as void
  };

  let idxOfClozes = 0;
  let idxOfAnswers = 0;
  for (let term of terms) {
    const normalizedTerm: DenormalizedTerm = {
      ...term,
      attributes: {
        ...term.attributes,
        clozes: [] as DenormalizedCloze[]
      },
      noteId: undefined as void,
      language: undefined as void
    };

    denormalized.attributes.terms.push(normalizedTerm);

    for (; idxOfClozes < clozes.length; ++idxOfClozes) {
      const cloze = clozes[idxOfClozes];
      if (
        cloze.reference !== term.attributes.reference ||
        cloze.marker !== term.attributes.marker ||
        cloze.noteId !== term.noteId
      ) {
        break;
      }

      let normalizedCloze: DenormalizedCloze = {
        ...cloze,
        attributes: {
          ...cloze.attributes,
          answers: []
        },
        noteId: undefined as void,
        reference: undefined as void,
        marker: undefined as void,
        clozeIdx: undefined as void,
        language: undefined as void
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

  return denormalized;
}

export function expandedNote(
  denormalizedNote: DenormalizedNote,
  id: string,
  path: string,
  version: string
): NoteTree {
  const note: Note = {
    ...denormalizedNote,
    attributes: {
      ...denormalizedNote.attributes,
      terms: undefined as void
    },
    id,
    path,
    version
  };

  const terms = [] as Term[];
  const clozes = [] as Cloze[];
  const clozeAnswers = [] as ClozeAnswer[];

  const noteTree: NoteTree = {
    note,
    terms,
    clozes,
    clozeAnswers
  };

  for (let normalizedTerm of denormalizedNote.attributes.terms) {
    const term: Term = {
      ...normalizedTerm,
      attributes: {
        ...normalizedTerm.attributes,
        clozes: undefined as void
      },
      language: note.attributes.language,
      noteId: note.id
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
        noteId: note.id
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
          noteId: note.id
        };

        clozeAnswers.push(clozeAnswer);
      }
    }
  }

  return noteTree;
}
