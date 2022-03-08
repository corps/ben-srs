import React from 'react';
import {StudyDetails} from "../study";

interface Props {
  studyDetails: StudyDetails
  selectRow: (studyDetails: StudyDetails) => void,
}

export function TermSearchResult({studyDetails, selectRow}: Props) {
  const {beforeTerm, cloze, clozed, afterTerm, afterCloze, beforeCloze} = studyDetails;
  return <a href="javascript:void(0)" className="no-underline color-inherit" tabIndex={0}
            key={cloze.noteId + cloze.reference + cloze.marker}
            onClick={() => selectRow(studyDetails)}>
    {beforeTerm.slice(Math.max(beforeTerm.length - 12, 0))}<b>{beforeCloze}{clozed}{afterCloze}</b> {afterTerm}
  </a>
}