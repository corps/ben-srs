import React, { Dispatch, useCallback, useEffect, useMemo } from 'react';
import {
  defaultStudyDetails,
  StudyDetails,
  studyDetailsForCloze
} from '../study';
import { SearchList } from './SearchList';
import {
  asIterator,
  chainIndexIterators,
  filterIndexIterator,
  flatMapIndexIterator,
  flattenIndexIterator,
  Indexer,
  IndexIterator,
  mapIndexIterator
} from '../../shared/indexable';
import { Cloze, denormalizedNote, Term } from '../notes';
import { TermSearchResult } from './TermSearchResult';
import { useWorkflowRouting } from '../hooks/useWorkflowRouting';
import { Study } from './Study';
import { bindSome, some, withDefault } from '../../shared/maybe';
import { useTime } from '../hooks/useTime';
import { minutesOfTime } from '../utils/time';
import { useUpdateNote } from '../hooks/useUpdateNote';
import { EditTerm } from './EditTerm';
import { useNotesIndex } from '../hooks/useNotesIndex';
import { useRoute } from '../hooks/useRoute';

interface Props {
  onReturn?: Dispatch<void>;
  noteId: string;
  marker: string;
  reference: string;
  clozeIdx: number;
  seenNoteIds: string[];
}

export function RelatedStudy(props: Props) {
  const [_, setRoute] = useRoute();
  const defaultReturn = useCallback(() => setRoute(() => null), [setRoute]);
  const {
    onReturn = defaultReturn,
    noteId,
    marker,
    reference,
    clozeIdx,
    seenNoteIds
  } = props;
  const now = useTime();
  const minutes = minutesOfTime(now);
  const updatedNote = useUpdateNote();

  const updateNoteAndConfirm = useUpdateNote(true);
  const editTermRouting = useWorkflowRouting(
    EditTerm,
    RelatedStudy,
    updateNoteAndConfirm
  );

  const [indexes] = useNotesIndex();
  const { clozes, terms } = indexes;
  const selectTermRouting = useWorkflowRouting(Study, RelatedStudy);
  const studyDetails: StudyDetails = useMemo(() => {
    return withDefault(
      bindSome(
        Indexer.getFirstMatching(clozes.byNoteIdReferenceMarkerAndClozeIdx, [
          noteId,
          reference,
          marker,
          clozeIdx
        ]),
        (cloze: Cloze) => studyDetailsForCloze(cloze, indexes)
      ),
      defaultStudyDetails
    );
  }, [
    clozeIdx,
    clozes.byNoteIdReferenceMarkerAndClozeIdx,
    indexes,
    marker,
    noteId,
    reference
  ]);

  const startRelatedStudy = useCallback(
    (sd: StudyDetails) => {
      selectTermRouting(
        {
          reference: sd.cloze.reference,
          marker: sd.cloze.marker,
          noteId: sd.cloze.noteId,
          seenNoteIds: [...seenNoteIds, noteId]
        },
        { onReturn, noteId, marker, reference, clozeIdx, seenNoteIds }
      );
    },
    [
      clozeIdx,
      marker,
      noteId,
      onReturn,
      reference,
      selectTermRouting,
      seenNoteIds
    ]
  );

  const iterator = useMemo(() => {
    const allRelated: IndexIterator<string> = flatMapIndexIterator(
      asIterator(studyDetails.related),
      ([t, related]) => asIterator(related)
    );
    const sds: IndexIterator<StudyDetails> = filterIndexIterator(
      flattenIndexIterator(
        flatMapIndexIterator(allRelated, (related) => {
          const relatedRange =
            related.length > 1
              ? [related + String.fromCodePoint(0x10ffff)]
              : [related + String.fromCodePoint(0x01)];

          const termsIter: IndexIterator<Term> = Indexer.iterator(
            terms.byReference,
            [related],
            relatedRange
          );
          const clozeIter: IndexIterator<Cloze> = flattenIndexIterator(
            mapIndexIterator(termsIter, (term) =>
              Indexer.getFirstMatching(
                clozes.byNoteIdReferenceMarkerAndClozeIdx,
                [term.noteId, term.attributes.reference, term.attributes.marker]
              )
            )
          );
          return mapIndexIterator(clozeIter, (cloze) =>
            studyDetailsForCloze(cloze, indexes)
          );
        })
      ),
      ({
        cloze: {
          noteId,
          attributes: {
            schedule: { lastAnsweredMinutes, nextDueMinutes }
          }
        }
      }) =>
        !seenNoteIds.includes(noteId) &&
        (nextDueMinutes < minutes ||
          minutes >
            (nextDueMinutes - lastAnsweredMinutes) * 0.25 + lastAnsweredMinutes)
    );

    return mapIndexIterator(sds, (sd) => (
      <TermSearchResult studyDetails={sd} selectRow={startRelatedStudy} />
    ));
  }, [
    clozes.byNoteIdReferenceMarkerAndClozeIdx,
    indexes,
    minutes,
    startRelatedStudy,
    studyDetails.related,
    terms.byReference,
    seenNoteIds
  ]);

  const [hasSome, i] = useMemo(() => {
    const next = iterator();
    let consumed = false;
    return [
      !!next,
      chainIndexIterators(() => {
        if (consumed) return null;
        consumed = true;
        return next;
      }, iterator)
    ] as [boolean, IndexIterator<React.ReactElement>];
  }, [iterator]);

  useEffect(() => {
    if (!hasSome) {
      onReturn();
    }
  }, [hasSome, onReturn]);

  const removeRelated = useCallback(
    async (term: Term, allRelated: string[], toRemove: string) => {
      const normalized = denormalizedNote(studyDetails.noteTree);
      const updatedAttributes = (normalized.attributes = {
        ...normalized.attributes
      });
      const updatedTerms = (updatedAttributes.terms = [
        ...updatedAttributes.terms
      ]);

      for (let i = 0; i < updatedTerms.length; ++i) {
        const updatedTerm = (updatedTerms[i] = { ...updatedTerms[i] });
        if (
          updatedTerm.attributes.marker === term.attributes.marker &&
          updatedTerm.attributes.reference === term.attributes.reference
        ) {
          const updatedTermAttributes = (updatedTerm.attributes = {
            ...updatedTerm.attributes
          });
          updatedTermAttributes.related = allRelated.filter(
            (r) => r !== toRemove
          );
        }
      }

      await updatedNote(some(studyDetails.noteTree), normalized);
    },
    [studyDetails.noteTree, updatedNote]
  );

  return (
    <SearchList iterator={i} onReturn={onReturn}>
      {studyDetails.related.map(([term, allRelated]) => (
        <span
          className="mh2"
          key={term.attributes.reference + term.attributes.marker}
        >
          From{' '}
          <a
            href="javascript:void(0)"
            onClick={() =>
              editTermRouting(
                {
                  ...studyDetails.cloze,
                  normalized: denormalizedNote(studyDetails.noteTree)
                },
                props
              )
            }
          >
            {term.attributes.reference}
          </a>
          :{' '}
          {allRelated.map((related) => (
            <span className="mh2" key={related}>
              <b>{related}</b> (
              <a
                href="javascript:void(0)"
                onClick={() => removeRelated(term, allRelated, related)}
              >
                [X]
              </a>
              ){' '}
            </span>
          ))}
        </span>
      ))}
    </SearchList>
  );
}
