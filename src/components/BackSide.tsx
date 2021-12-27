import React, {PropsWithChildren, useState} from 'react';
import {StudyDetails} from "../study";
import {Answer} from "../scheduler";
import {answerMiss, answerOk, answerSkip, Study} from "./Study";
import {minutesOfTime} from "../utils/time";
import {FrontSide} from "./FrontSide";

interface Props {
  studyDetails: StudyDetails,
  readCard: () => void,
  answerMain: (answer: Answer) => void,
  answerRelated: (c: StudyDetails, answer: Answer) => void,
  unAnsweredRelated: StudyDetails[],
  startNext: () => void,
  showRelated: boolean,
  now: number,
  studyStarted: number,
  editNote: (noteId: string) => void,
}

function AnswerDetails(props: PropsWithChildren<{studyDetails: StudyDetails, readCard: null | (() => void)}>) {
  const {children, studyDetails, readCard} = props;

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
        読み上げ
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

function MainAnswerBackSide({studyDetails, readCard, answerMain, now, studyStarted, editNote}: Props) {
  return <AnswerDetails studyDetails={studyDetails} readCard={readCard}>
    <div className="f5 mt2 tc">
      <button className="mh1 pa1 br2"
              onClick={() => answerMain(answerOk(now, studyStarted, studyDetails))}>
        OK!
      </button>
      <button className="mh1 pa1 br2"
              onClick={() => answerMain(answerSkip(now))}>
        スキップ
      </button>
      <button className="mh1 pa1 br2"
              onClick={() => answerMain(answerMiss(now))}>
        間違えた！
      </button>
      <button className="mh1 pa1 br2" onClick={() => editNote(studyDetails.cloze.noteId)}>
        編集
      </button>
    </div>
  </AnswerDetails>
}

function relatedOk(now: number): Answer {
  return [minutesOfTime(now), ["f", 2.0]];
}

function relatedMiss(now: number): Answer {
  return [minutesOfTime(now), ["f", 0.6]];
}

function RelatedCard(props: {studyDetails: StudyDetails, answerRelated: Props['answerRelated'], now: Props['now']}) {
  const {studyDetails, answerRelated, now} = props;

  return <div className="f5 mt5 overflow-y-auto" style={{maxHeight: 65}}>
    <button className="mh1 pa1 br2"
            onClick={(e) => {
              e.stopPropagation();
              answerRelated(studyDetails, relatedOk(now));
            }}>
      OK!
    </button>
    <button className="ml1 mr3 pa1 br2"
            onClick={e => {
              e.stopPropagation();
              answerRelated(studyDetails, relatedMiss(now));
            }}>
      間違えた！
    </button>
    <span className="br2 pa1 bg-light-yellow fw9">
      {studyDetails.beforeCloze}{studyDetails.clozed}{studyDetails.afterCloze}
    </span> -
    <span>
      {studyDetails.definition}
    </span>
  </div>;
}


function RelatedBackSide({answerRelated, startNext, unAnsweredRelated, now}: Props) {
  return <div className="mw6 center">
    <div className="f5 ph3 tc">
      <button className="mh1 pa1 br2" onClick={() => startNext()}>
        Done
      </button>
    </div>

    {unAnsweredRelated.map((studyDetails, i) => <div className="ma2">
      <RelatedCard key={""+i} studyDetails={studyDetails} answerRelated={answerRelated} now={now}/>
    </div>)}
  </div>
}

export function BackSide(props: Props) {
  if (props.showRelated) {
    return <RelatedBackSide {...props}/>
  } else {
    return <MainAnswerBackSide {...props}/>
  }
}
