import React, {useCallback} from 'react';
import {StudyDetails} from "../study";
import {Answer} from "../scheduler";
import {answerMiss, answerOk, answerSkip, Study} from "./Study";

interface Props {
  studyDetails: StudyDetails,
  readCard: () => void,
  answerCard: (answer: Answer) => void,
  now: number,
  studyStarted: number,
  editNote: (noteId: string) => void,
}

export function BackSide({studyDetails, readCard, answerCard, now, studyStarted, editNote}: Props) {
  return <div className="mw6 center">
    <div className="f4 ph3 mb2 tc">
      {studyDetails.type === "flash" && studyDetails.beforeTerm}
      {studyDetails.beforeCloze}

      <span className="fw8 mh1">
        {studyDetails.clozed}
      </span>

      {studyDetails.afterCloze}
      {studyDetails.type === "flash" && studyDetails.afterTerm}

      <button className="mh1 pa1 br2 f5" onClick={readCard}>
        読み上げ
      </button>
    </div>

    <div className="f5 h5 overflow-x-hidden overflow-y-auto ph3">
      {studyDetails.cloze.attributes.type === "listen" ? <div className="mb3">
        {studyDetails.content.split("\n").map((s, i) => <span key={i + ""}>{s}<br/></span>)}
      </div> : null}
      {studyDetails.definition.split("\n").map((s, i) => <span key={i + ""}>{s}<br/></span>)}
    </div>

    <div className="f5 mt2 tc">
      <button className="mh1 pa1 br2"
              onClick={() => answerCard(answerOk(now, studyStarted, studyDetails))}>
        OK!
      </button>
      <button className="mh1 pa1 br2"
              onClick={() => answerCard(answerSkip(now))}>
        スキップ
      </button>
      <button className="mh1 pa1 br2"
              onClick={() => answerCard(answerMiss(now))}>
        間違えた！
      </button>
      <button className="mh1 pa1 br2" onClick={() => editNote(studyDetails.cloze.noteId)}>
        編集
      </button>
    </div>
  </div>
}
