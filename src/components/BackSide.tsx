import React, {PropsWithChildren, useCallback, useMemo} from 'react';
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

const urlRegex = /(https?:\/\/[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+)/;
function TextOrLink({text}: {text: string}) {
  const [tail, segments] = useMemo(() => {
    let tail = text;
    let segments: [string, string][] = [];
    let match = tail.match(urlRegex)
    while (match) {
      if (match.index == null) throw new Error('nope');
      segments.push([tail.substr(0, match.index), match[0]])
      tail = tail.slice(match.index + match[0].length)
      match = tail.match(urlRegex)
    }

    return [tail, segments] as [string, [string, string][]]
  }, [text])

  return <>
    {segments.map(([text, url], i) => {
      return <span key={i}>
        <>{text}</>
        <a href={url} target="_blank">{url}</a>
      </span>
    })}
    {tail}
  </>
}

function AnswerDetails(props: PropsWithChildren<{studyDetails: StudyDetails, readCard: null | (() => void)}>) {
  const {children, studyDetails, readCard} = props;

  const [ReadCardWrapper] = useWithKeybinding('j', readCard);

  return <div className="mw6 center">
    <div className="f4 ph3 mb2 tc">
      {studyDetails.type === "flash" && <TextOrLink text={studyDetails.beforeTerm}/>}
      {studyDetails.beforeCloze}

      <span className="fw8 mh1">
        {studyDetails.clozed}
      </span>

      {studyDetails.afterCloze}
      {studyDetails.type === "flash" && <TextOrLink text={studyDetails.afterTerm}/>}

      {readCard ? <button className="mh1 pa1 br2 f5" onClick={readCard}>
        <ReadCardWrapper>
          読み上げ
        </ReadCardWrapper>
      </button> : null}
    </div>

    <div className="f5 h5 overflow-x-hidden overflow-y-auto ph3">
      {studyDetails.cloze.attributes.type === "listen" ? <AnswerParagraph text={studyDetails.content}/> : null}
      <AnswerParagraph text={studyDetails.definition}/>
      {studyDetails.studyGuides.map((s, i) => <AnswerParagraph text={s} key={i}/>)}
    </div>
    {children}
  </div>;
}

function AnswerParagraph({text}: {text: string}) {
  return <div className="mb3">{text.split("\n").map((s, i) => <span key={i + ""}>
     <TextOrLink text={s}/>
  <br/></span>)}</div>
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