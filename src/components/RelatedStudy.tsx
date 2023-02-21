import React, {Dispatch, useCallback, useEffect, useMemo} from 'react';
import {defaultStudyDetails, StudyDetails, studyDetailsForCloze} from "../study";
import {useNotesIndex, useRoute} from "../hooks/contexts";
import {SearchList} from "./SearchList";
import {
  asIterator,
  chainIndexIterators, debugIterator,
  filterIndexIterator,
  flatMapIndexIterator,
  flattenIndexIterator,
  Indexer,
  IndexIterator,
  mapIndexIterator
} from "../utils/indexable";
import {Cloze, findNoteTree, normalizedNote, Term} from "../notes";
import {TermSearchResult} from "./TermSearchResult";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {Study} from "./Study";
import {bindSome, mapSome, some, withDefault} from "../utils/maybe";
import {useTime} from "../hooks/useTime";
import {minutesOfTime} from "../utils/time";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {SelectTerm} from "./SelectTerm";
import {EditTerm} from "./EditTerm";

interface Props {
  onReturn?: Dispatch<void>,
  noteId: string,
  marker: string,
  reference: string,
  clozeIdx: number,
  seenNoteIds: string[],
}

export function RelatedStudy(props: Props) {
  const setRoute = useRoute();
  const defaultReturn = useCallback(() => setRoute(() => null), [setRoute]);
  const {onReturn = defaultReturn, noteId, marker, reference, clozeIdx, seenNoteIds} = props;
  const now = useTime();
  const minutes = minutesOfTime(now);
  const updatedNote = useUpdateNote();

  const updateNoteAndConfirm = useUpdateNote(true);
  const editTermRouting = useWorkflowRouting(EditTerm, RelatedStudy, updateNoteAndConfirm);

  const indexes = useNotesIndex();
  const {clozes, terms} = indexes;
  const selectTermRouting = useWorkflowRouting(Study, RelatedStudy);
  const studyDetails: StudyDetails = useMemo(() => {
    return withDefault(bindSome(Indexer.getFirstMatching(clozes.byNoteIdReferenceMarkerAndClozeIdx,
        [noteId, reference, marker, clozeIdx]
      ),
      cloze => studyDetailsForCloze(cloze, indexes)
    ), defaultStudyDetails)
  }, [clozeIdx, clozes.byNoteIdReferenceMarkerAndClozeIdx, indexes, marker, noteId, reference])

  const relatedStudyDetails: StudyDetails[] = useMemo(() => {
    const results: StudyDetails[] = [];
    const seen: Record<string, boolean> = {};
    for (let [_, r] of studyDetails.related) {
      for (let rr of r) {
        if (rr in seen) continue;
        seen[rr] = true;

        const relatedRange = rr.length > 1 ? [rr + String.fromCodePoint(0x10ffff)] :
            [rr + String.fromCodePoint(0x01)];
        const termsIter: IndexIterator<Term> = Indexer.iterator(terms.byReference,
            [rr],
            relatedRange
        );

        const clozeIter: IndexIterator<Cloze> = flattenIndexIterator(mapIndexIterator(termsIter,
            term => Indexer.getFirstMatching(clozes.byNoteIdReferenceMarkerAndClozeIdx,
                [term.noteId, term.attributes.reference, term.attributes.marker]
            )
        ));
        for (let n = clozeIter(); n; n = clozeIter()) {
          mapSome(studyDetailsForCloze(n[0], indexes), sd => results.push(sd));
        }
      }
    }

    return results.filter(({cloze: {noteId, attributes: {schedule: {lastAnsweredMinutes, nextDueMinutes}}}}) =>
        !seenNoteIds.includes(noteId) && nextDueMinutes < minutes);
  }, [
    clozes.byNoteIdReferenceMarkerAndClozeIdx,
    indexes,
    minutes,
    studyDetails.related,
    terms.byReference,
    seenNoteIds
  ]);

  const nextSeenNoteIds = useMemo(() => {
    return seenNoteIds.concat(relatedStudyDetails.map(({cloze: {noteId}}) => noteId))
  }, [seenNoteIds, relatedStudyDetails]);

  const startRelatedStudy = useCallback((sd: StudyDetails) => {
    selectTermRouting({
      reference: sd.cloze.reference,
      marker: sd.cloze.marker,
      noteId: sd.cloze.noteId,
      seenNoteIds: nextSeenNoteIds,
    }, {onReturn, noteId, marker, reference, clozeIdx, seenNoteIds})
  }, [clozeIdx, marker, noteId, onReturn, reference, selectTermRouting, seenNoteIds, nextSeenNoteIds]);

  const iterator = useMemo(() => {
    return mapIndexIterator(asIterator(relatedStudyDetails), sd => <TermSearchResult studyDetails={sd} selectRow={startRelatedStudy}/>)
  }, [
    relatedStudyDetails,
      startRelatedStudy
  ]);

  const [hasSome, i] = useMemo(() => {
    const next = iterator();
    let consumed = false;
    return [
      !!next, chainIndexIterators(() => {
        if (consumed) return null;
        consumed = true;
        return next;
      }, iterator)
    ] as [boolean, IndexIterator<React.ReactElement>]
  }, [iterator])

  useEffect(() => {
    if (!hasSome) {
      onReturn();
    }
  }, [hasSome, onReturn])

  const removeRelated = useCallback(async (term: Term, allRelated: string[], toRemove: string) => {
    const normalized = normalizedNote(studyDetails.noteTree);
    const updatedAttributes = normalized.attributes = {...normalized.attributes};
    const updatedTerms = updatedAttributes.terms = [...updatedAttributes.terms];

    for (let i = 0; i < updatedTerms.length; ++i) {
      const updatedTerm = updatedTerms[i] = {...updatedTerms[i]};
      if (updatedTerm.attributes.marker === term.attributes.marker && updatedTerm.attributes.reference === term.attributes.reference) {
        const updatedTermAttributes = updatedTerm.attributes = {...updatedTerm.attributes};
        updatedTermAttributes.related = allRelated.filter(r => r !== toRemove);
      }
    }

    await updatedNote(some(studyDetails.noteTree), normalized)
  }, [studyDetails.noteTree, updatedNote]);

  return <SearchList iterator={i} onReturn={onReturn}>
    {studyDetails.related.map(([term, allRelated]) => <span className="mh2" key={term.attributes.reference + term.attributes.marker}>
      From <a href="javascript:void(0)" onClick={() => editTermRouting({
      ...studyDetails.cloze, normalized: normalizedNote(studyDetails.noteTree),
    }, props)}>{term.attributes.reference}</a>: {allRelated.map(related => <span className="mh2" key={related}>
      <b>{related}</b> (<a href="javascript:void(0)"
                           onClick={() => removeRelated(term, allRelated, related)}>[X]</a>) </span>)}
    </span>)}
  </SearchList>
}
