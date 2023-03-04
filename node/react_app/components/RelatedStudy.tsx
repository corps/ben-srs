import React, { Dispatch, useCallback, useEffect, useMemo } from 'react';
import {
  defaultStudyDetails,
  StudyDetails,
  studyDetailsForCloze
} from '../study';
import { SearchList } from './SearchList';
import {
  asIterator,
  Indexer,
  mapIndexIterator,
  peekIndexIterator
} from '../../shared/indexable';
import { Cloze, Term, TermIdentifier } from '../notes';
import { TermSearchResult } from './TermSearchResult';
import { useWorkflowRouting } from '../hooks/useWorkflowRouting';
import { Study } from './Study';
import { bindSome, mapSome, some, withDefault } from '../../shared/maybe';
import { useTime } from '../hooks/useTime';
import { minutesOfTime } from '../utils/time';
import { useUpdateNote } from '../hooks/useUpdateNote';
import { EditTerm } from './EditTerm';
import { useNotesIndex } from '../hooks/useNotesIndex';
import { useRoute } from '../hooks/useRoute';
import { denormalizedNote } from '../services/indexes';

interface Props {
  onReturn?: Dispatch<void>;
  noteId: string;
  marker: string;
  reference: string;
  clozeIdx: number;
  seenTermIds: TermIdentifier[];
}

function useLookupRelatedStudyDetails({
  noteId,
  reference,
  marker,
  clozeIdx
}: Props) {
  const [indexes] = useNotesIndex();
  const { clozes } = indexes;
  return useMemo(() => {
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
}

export function RelatedStudy(props: Props) {
  const [_, setRoute] = useRoute();
  const defaultReturn = useCallback(() => setRoute(() => null), [setRoute]);
  const { onReturn = defaultReturn, seenTermIds } = props;
  const now = useTime();
  const minutes = minutesOfTime(now);

  const updateNoteAndConfirm = useUpdateNote(true);
  const editTermRouting = useWorkflowRouting(
    EditTerm,
    RelatedStudy,
    updateNoteAndConfirm
  );

  const selectTermRouting = useWorkflowRouting(Study, RelatedStudy);
  const studyDetails = useLookupRelatedStudyDetails(props);
  const relatedStudyDetails = useRelatedStudyDetails(
    studyDetails,
    seenTermIds,
    minutes
  );
  const startRelatedStudy = useCallback(
    (sd: StudyDetails) => {
      selectTermRouting(
        {
          termId: { ...sd.cloze },
          seenTermIds: [
            ...seenTermIds,
            ...relatedStudyDetails.map(({ cloze }) => cloze)
          ]
        },
        props
      );
    },
    [selectTermRouting, seenTermIds, relatedStudyDetails, props]
  );
  const [hasSome, i] = useMemo(
    () =>
      peekIndexIterator(
        mapIndexIterator(asIterator(relatedStudyDetails), (sd) => (
          <TermSearchResult studyDetails={sd} selectRow={startRelatedStudy} />
        ))
      ),
    [relatedStudyDetails, startRelatedStudy]
  );

  useEffect(() => {
    if (!hasSome) {
      onReturn();
    }
  }, [hasSome, onReturn]);

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
                  denormalized: denormalizedNote(studyDetails.noteTree)
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
              <b>{related}</b>
            </span>
          ))}
        </span>
      ))}
    </SearchList>
  );
}

function useRelatedStudyDetails(
  studyDetails: StudyDetails,
  seenTermIds: TermIdentifier[],
  minutes: number
) {
  const [indexes] = useNotesIndex();
  return useMemo(() => {
    const allRelated: string[] = [];
    for (let [t, related] of studyDetails.related) {
      allRelated.push(...related);
    }

    const allRelatedStudyDetails: StudyDetails[] = [];
    allRelated.forEach((related) => {
      const relatedRange =
        related.length > 1
          ? [related + String.fromCodePoint(0x10ffff)]
          : [related + String.fromCodePoint(0x01)];
      const terms = Indexer.iterator(
        indexes.terms.byReference,
        [related],
        relatedRange
      );

      for (let term = terms(); term; term = terms()) {
        mapSome(
          bindSome(
            bindSome(term, (term) =>
              Indexer.getFirstMatching(
                indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
                [term.noteId, term.attributes.reference, term.attributes.marker]
              )
            ),
            (cloze) => studyDetailsForCloze(cloze, indexes)
          ),
          (sd) => {
            if (filterRelatedStudy(sd, seenTermIds, minutes)) {
              allRelatedStudyDetails.push(sd);
            }
          }
        );
      }
    });
    return allRelatedStudyDetails;
  }, [studyDetails.related, indexes, seenTermIds, minutes]);
}

function filterRelatedStudy(
  studyDetails: StudyDetails,
  seenTermIds: TermIdentifier[],
  minutes: number
) {
  const { cloze } = studyDetails;
  const {
    attributes: {
      schedule: { lastAnsweredMinutes, nextDueMinutes }
    }
  } = cloze;
  if (
    !seenTermIds.every(
      ({ noteId, reference, marker }) =>
        noteId != cloze.noteId ||
        reference != cloze.reference ||
        marker != cloze.marker
    )
  ) {
    return false;
  }

  const isDue = nextDueMinutes < minutes;
  if (isDue) return true;
  const interval = nextDueMinutes - lastAnsweredMinutes;
  return (minutes - lastAnsweredMinutes) / interval > 0.5;
}
