import React, {Dispatch, useCallback, useEffect, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute} from "../hooks/contexts";
import {useToggle} from "../hooks/useToggle";
import {useTime} from "../hooks/useTime";
import {findNextStudyDetails, findTermInNormalizedNote, StudyDetails} from "../study";
import {describeDuration, minutesOfTime, timeOfMinutes} from "../utils/time";
import {
  ClozeType, findNoteTree, newNormalizedNote, normalizedNote, NoteIndexes
} from "../notes";
import {mapSome, mapSomeAsync, Maybe, some, withDefault} from "../utils/maybe";
import {FileStore} from "../services/storage";
import {playAudio, speak} from "../services/speechAndAudio";
import {useStudyData} from "../hooks/useStudyData";
import {FlexContainer, Row, VCentered, VCenteringContainer} from "./layout-utils";
import {SimpleNavLink} from "./SimpleNavLink";
import {Answer, scheduledBy} from "../scheduler";
import {useKeypresses} from "../hooks/useKeypress";
import {BackSide} from "./BackSide";
import {FrontSide} from "./FrontSide";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {SelectTerm} from "./SelectTerm";

interface Props {
  onReturn?: Dispatch<void>,
  language: string,
  audioStudy: boolean,
}

export function Study(props: Props) {
  const notesIndex = useNotesIndex();
  const storage = useFileStorage();
  const [showBack, setShowBack] = useState(false);
  const toggleShowBack = useToggle(setShowBack);
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const setRoute = useRoute();
  const time = useTime(1);

  const {language, audioStudy, onReturn = () => setRoute(() => null)} = props;

  const updateNoteAndConfirm = useUpdateNote(true);
  const selectTermRouting = useWorkflowRouting(SelectTerm, Study, updateNoteAndConfirm);
  const editNote = useCallback((noteId: string) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, noteId), normalizedNote), {...newNormalizedNote});
    selectTermRouting({noteId, normalized}, {onReturn, language, audioStudy}, () => ({onReturn, language, audioStudy}))
  }, [audioStudy, language, notesIndex, onReturn, selectTermRouting])

  const prepareNext = useCallback(() => {
    setCardStartedAt(Date.now());
    setShowBack(false);

    return findNextStudyDetails(language, minutesOfTime(time), notesIndex, audioStudy);
  }, [language, time, notesIndex, audioStudy]);
  const studyData = useStudyData(time, language, audioStudy);
  const [studyDetails, setStudyDetails] = useState(prepareNext);
  const startNext = useCallback(() => setStudyDetails(prepareNext()), [setStudyDetails, prepareNext]);
  const answerCard = useAnswerCard(studyDetails, notesIndex, startNext);
  const readCard = useReadCard(studyDetails, storage);

  const dueTime = withDefault(mapSome(
    studyDetails,
    studyDetails => timeOfMinutes(studyDetails.cloze.attributes.schedule.nextDueMinutes)
  ), 0);
  const intervalTime = withDefault(mapSome(
    studyDetails,
    studyDetails => timeOfMinutes(studyDetails.cloze.attributes.schedule.intervalMinutes)
  ), 0);

  useKeypresses((key: string) => {
    if (key === " " || key === "f") toggleShowBack();
    if (key === "a") mapSome(studyDetails, studyDetails => answerCard(answerOk(time, cardStartedAt, studyDetails)));
    if (key === "s") mapSome(studyDetails, studyDetails => answerCard(answerMiss(time)));
    if (key === "d") mapSome(studyDetails, studyDetails => answerCard(answerSkip(time)));
    if (key === "j") mapSome(studyDetails, studyDetails => readCard());
  }, [toggleShowBack, time, cardStartedAt, studyDetails, answerCard]);

  useEffect(() => {
    if (!studyDetails) onReturn();
  }, [studyDetails, onReturn]);

  return withDefault(mapSome(
    studyDetails,
    studyDetails => <FlexContainer vertical className="vh-100 overflow-x-hidden overflow-y-hidden">
      <Row fixedRow className="h3 w-100">
        <VCenteringContainer>
          <VCentered className="tc">
            <div>
            <span className="dn dib-l">
              <span className="pv1 ph2 br2 bg-gray white">f</span>
            </span>

              <span className="mh2">経過</span>
              {studyData.studied}/{studyData.studied + studyData.due}
              <span className="mh2">{describeDuration(time - cardStartedAt)}</span>

              <SimpleNavLink
                onClick={onReturn}
                className="mh2">
                戻る
              </SimpleNavLink>
            </div>

            <div>
              期日: {describeDuration(time - dueTime, false)} <br/>
              期間: {describeDuration(intervalTime)}
            </div>
          </VCentered>
        </VCenteringContainer>
      </Row>

      <Row stretchRow className="w-100 overflow-y-auto word-wrap">
        <div className="w-100 f3 pv2"
             onClick={(e) => e.target instanceof HTMLButtonElement ? null : toggleShowBack()}>
          <VCenteringContainer>
            <VCentered>
              {showBack ?
                <BackSide editNote={editNote} studyDetails={studyDetails} answerCard={answerCard} readCard={readCard}
                          now={time} studyStarted={cardStartedAt}/> :
                <FrontSide readCard={readCard} studyDetails={studyDetails}/>}
            </VCentered>
          </VCenteringContainer>
        </div>
      </Row>
    </FlexContainer>
  ), null);
}

function useReadCard(studyDetails: Maybe<StudyDetails>, store: FileStore) {
  return useCallback(async () => {
    await mapSomeAsync(studyDetails, async studyDetails => {
      if (studyDetails.audioFileId) {
        const storedBlob = await store.fetchBlob(studyDetails.audioFileId);
        await mapSomeAsync(storedBlob, async ({blob, path}) => {
          await playAudio(blob, path);
        });
      } else {
        speak(studyDetails.cloze.language, studyDetails.spoken);
      }
    })
  }, [studyDetails, store]);
}

function useAnswerCard(studyDetails: Maybe<StudyDetails>, noteIndexes: NoteIndexes, startNext: Dispatch<void>) {
  const updateNote = useUpdateNote();

  return useCallback(async (answer: Answer) => {
    await mapSomeAsync(studyDetails, async studyDetails => {
      const cloze = studyDetails.cloze;
      const schedule = scheduledBy(cloze.attributes.schedule, answer);
      await mapSomeAsync(findNoteTree(noteIndexes, cloze.noteId), async tree => {
        let normalized = normalizedNote(tree);
        await mapSomeAsync(findTermInNormalizedNote(normalized, cloze.reference, cloze.marker), async term => {
          if (term.attributes.clozes.length > cloze.clozeIdx) return;

          const termIdx = normalized.attributes.terms.indexOf(term);
          term = {...term};

          normalized = {...normalized};
          normalized.attributes = {...normalized.attributes};
          normalized.attributes.terms = normalized.attributes.terms.slice();
          normalized.attributes.terms.splice(termIdx, 1, term);

          term.attributes = {...term.attributes};
          term.attributes.clozes = term.attributes.clozes.slice();

          let updatingCloze = term.attributes.clozes[cloze.clozeIdx];
          updatingCloze = term.attributes.clozes[cloze.clozeIdx] = {
            ...updatingCloze,
          };
          updatingCloze.attributes = {...updatingCloze.attributes};
          updatingCloze.attributes.schedule = schedule;
          updatingCloze.attributes.answers = updatingCloze.attributes.answers.concat([answer]);

          await updateNote(some(tree), normalized);
          startNext();
        });
      });
    })
  }, [studyDetails, noteIndexes, startNext, updateNote]);
}

export function answerOk(now: number, studyStarted: number, studyDetails: StudyDetails): Answer {
  const timeToAnswer = now - studyStarted;
  return [minutesOfTime(now), ["f", okAnswerFactor(timeToAnswer, studyDetails.type)]];
}

export function answerMiss(now: number): Answer {
  return [minutesOfTime(now), ["f", 0.6]];
}

export function answerSkip(now: number): Answer {
  return [minutesOfTime(now), ["d", 0.6, 2.0]];
}

function okAnswerFactor(timeToAnswer: number, type: ClozeType) {
  switch (type) {
    case "produce":
      return timeToAnswer < 6000 ? 3.0 : 2.4;

    case "recognize":
      return timeToAnswer <= 4000 ? 3.0 : 2.0;

    case "listen":
      return timeToAnswer < 10000 ? 3.6 : 2.8;

    case "speak":
      return timeToAnswer < 10000 ? 3.6 : 2.8;
  }

  return 1;
}
