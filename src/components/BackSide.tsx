import React, {PropsWithChildren, useCallback} from 'react';
import {StudyDetails} from "../study";
import {Answer} from "../scheduler";
import {answerMiss, answerOk, answerSkip} from "./Study";
import {useWithKeybinding} from "../hooks/useWithKeybinding";

interface Props {
  studyDetails: StudyDetails,
  readCard: () => void,
  answerFront: (answer: Answer) => void,
  startNext: () => void,
  now: number,
  studyStarted: number,
  editNote: (noteId: string) => void,
}

function AnswerDetails(props: PropsWithChildren<{studyDetails: StudyDetails, readCard: null | (() => void)}>) {
  const {children, studyDetails, readCard} = props;

  const [ReadCardWrapper] = useWithKeybinding('j', readCard);

  return <div className="mw6 center">
    <div className="f4 ph3 mb2 tc">
      {studyDetails.type === "flash" && studyDetails.beforeTerm}
      {studyDetails.beforeCloze}

      <span className="fw8 mh1">
        {studyDetails.clozed}
      </span>

      {studyDetails.afterCloze}
      {studyDetails.type === "flash" && studyDetails.afterTerm}

      {readCard ? <button className="mh1 pa1 br2 f5" onClick={readCard}>
        <ReadCardWrapper>
          読み上げ
        </ReadCardWrapper>
      </button> : null}
    </div>

    <div className="f5 h5 overflow-x-hidden overflow-y-auto ph3">
      {studyDetails.cloze.attributes.type === "listen" ? <div className="mb3">
        {studyDetails.content.split("\n").map((s, i) => <span key={i + ""}>{s}<br/></span>)}
      </div> : null}
      {studyDetails.definition.split("\n").map((s, i) => <span key={i + ""}>{s}<br/></span>)}
    </div>
    {children}
  </div>;
}

export function BackSide({studyDetails, readCard, answerFront, now, studyStarted, editNote}: Props) {
  const [OkWrapper, ok] = useWithKeybinding('a', useCallback(()=>{
    answerFront(answerOk(now, studyStarted, studyDetails));
  }, [answerFront, now, studyDetails, studyStarted]))

  const [SkipWrapper, skip] = useWithKeybinding('d', useCallback(()=>{
    answerFront(answerSkip(now));
  }, [answerFront, now]))

  const [MissWrapper, miss] = useWithKeybinding('s', useCallback(()=>{
    answerFront(answerMiss(now));
  }, [answerFront, now]))

  const [EditWrapper, edit] = useWithKeybinding('e', useCallback(() =>{
    editNote(studyDetails.cloze.noteId);
  }, [editNote, studyDetails.cloze.noteId]))

  return <AnswerDetails studyDetails={studyDetails} readCard={readCard}>
    <div className="f5 mt2 tc">
      <button className="mh1 pa1 br2" onClick={ok}>
        <OkWrapper>
          OK!
        </OkWrapper>
      </button>

      <button className="mh1 pa1 br2" onClick={skip}>
        <SkipWrapper>
          スキップ
        </SkipWrapper>
      </button>

      <button className="mh1 pa1 br2" onClick={miss}>
        <MissWrapper>
          間違えた！
        </MissWrapper>
      </button>

      <button className="mh1 pa1 br2" onClick={edit}>
        <EditWrapper>
          編集
        </EditWrapper>
      </button>
    </div>
  </AnswerDetails>
}

//
// function RelatedCard(props: {studyDetails: StudyDetails, answerRelated: Props['answerRelated'], now: Props['now'], term: Term}) {
//   const {studyDetails, answerRelated, now, term} = props;
//
//   return <div className="f5 mt5 overflow-y-auto" style={{maxHeight: 65}}>
//     <button className="mh1 pa1 br2"
//             onClick={(e) => {
//               e.stopPropagation();
//               answerRelated(studyDetails, relatedOk(now));
//             }}>
//       OK!
//     </button>
//     <button className="ml1 mr3 pa1 br2"
//             onClick={e => {
//               e.stopPropagation();
//               answerRelated(studyDetails, relatedMiss(now));
//             }}>
//       間違えた！
//     </button>
//     <span className="br2 pa1 bg-light-yellow fw9">
//       {term.attributes.reference}
//     </span> -
//     <span className="br2 pa1 bg-light-green fw9">
//       {studyDetails.beforeCloze}{studyDetails.clozed}{studyDetails.afterCloze}
//     </span> -
//     <span>
//       {studyDetails.definition}
//     </span>
//   </div>;
// }