import React, {Dispatch, useCallback, useMemo} from 'react';
import {StudyDetails, studyDetailsForCloze} from "../study";
import {useNotesIndex, useRoute} from "../hooks/contexts";
import {SearchList} from "./SearchList";
import {
  asIterator, filterIndexIterator, flatMapIndexIterator, flattenIndexIterator, Indexer, IndexIterator, mapIndexIterator
} from "../utils/indexable";
import {Cloze, Term} from "../notes";
import {TermSearchResult} from "./TermSearchResult";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {Study} from "./Study";
import {mapSome, withDefault} from "../utils/maybe";
import {useTime} from "../hooks/useTime";
import {minutesOfTime} from "../utils/time";

interface Props {
  onReturn?: Dispatch<void>,
  studyDetails: StudyDetails,
}

export function RelatedStudy(props: Props) {
  const setRoute = useRoute();
  const {onReturn = () => setRoute(() => null), studyDetails} = props;
  const now = useTime();
  const minutes = minutesOfTime(now);

  const indexes = useNotesIndex();
  const {clozes, terms} = indexes;
  const selectTermRouting = useWorkflowRouting(Study, RelatedStudy);

  const startRelatedStudy = useCallback((sd: StudyDetails) => {
    selectTermRouting({ audioStudy: false, language: sd.cloze.language, reference: sd.cloze.reference, marker: sd.cloze.marker, noteId: sd.cloze.noteId }, { onReturn, studyDetails })
  }, [onReturn, selectTermRouting, studyDetails]);

  const iterator = useMemo(() => {
    const sds: IndexIterator<StudyDetails> = filterIndexIterator(flattenIndexIterator(flatMapIndexIterator(asIterator(studyDetails.related), related => {
      const termsIter: IndexIterator<Term> = Indexer.iterator(terms.byReference, [related], [related + String.fromCodePoint(0x10ffff)]);
      const clozeIter: IndexIterator<Cloze> = flattenIndexIterator(mapIndexIterator(termsIter,
        term => Indexer.getFirstMatching(clozes.byNoteIdReferenceMarkerAndClozeIdx, [term.noteId, term.attributes.reference, term.attributes.marker])));
      return mapIndexIterator(clozeIter, cloze => studyDetailsForCloze(cloze, indexes));
    })), sd => withDefault(mapSome(sd.lastAnswer, lastAnswer => lastAnswer.answer[0]), 0) < (minutes - 60 * 12));

    return mapIndexIterator(sds, sd => <TermSearchResult studyDetails={sd} selectRow={startRelatedStudy}/>)
  }, [clozes.byNoteIdReferenceMarkerAndClozeIdx, indexes, minutes, startRelatedStudy, studyDetails.related, terms.byReference]);


  return <SearchList iterator={iterator} onReturn={onReturn}>
    Related Terms: <b>{studyDetails.related.join(' ')}</b>
  </SearchList>
}