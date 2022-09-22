import React, {Dispatch, useCallback, useEffect, useMemo, useState} from 'react';
import {useNotesIndex, useRoute, useStudyContext} from "../hooks/contexts";
import {useToggle} from "../hooks/useToggle";
import {useTime} from "../hooks/useTime";
import {
  findNextStudyClozeWithinTerm,
  findNextStudyDetails,
  findTermInNormalizedNote,
  okAnswerFactor,
  StudyDetails, studyDetailsForCloze
} from "../study";
import {describeDuration, minutesOfTime, timeOfMinutes} from "../utils/time";
import {
  ClozeAnswer, ClozeType, findNoteTree, newNormalizedNote, normalizedNote, NoteIndexes, Tagged, Term
} from "../notes";
import {bindSome, mapSome, mapSomeAsync, Maybe, some, withDefault} from "../utils/maybe";
import {useStudyData} from "../hooks/useStudyData";
import {FlexContainer, Row, VCentered, VCenteringContainer} from "./layout-utils";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {Answer, isWrongAnswer, scheduledBy} from "../scheduler";
import {useKeypresses} from "../hooks/useKeypress";
import {BackSide} from "./BackSide";
import {FrontSide} from "./FrontSide";
import {useNoteUpdateHistory, useUpdateNote} from "../hooks/useUpdateNote";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {SelectTerm} from "./SelectTerm";
import {useDataUrl} from "../hooks/useDataUrl";
import {Indexer} from "../utils/indexable";
import {RelatedStudy} from "./RelatedStudy";
import {HideIf} from "./HideIf";
import { useSpeechAndAudio } from '../hooks/useSpeechAndAudio';

interface Props {
  onReturn?: Dispatch<void>,
  noteId?: string,
  reference?: string,
  marker?: string,
  seenNoteIds?: string[],
  seenRelated?: boolean,
}

export function Study(props: Props) {
  const notesIndex = useNotesIndex();
  const [showBack, setShowBack] = useState(false);
  const toggleShowBack = useToggle(setShowBack);
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const setRoute = useRoute();
  const time = useTime(1000);
  const nowMinutes = minutesOfTime(time);
  const {undo, hasUndo, redo, hasRedo} = useNoteUpdateHistory();
  const [{tag: language, audioStudy}] = useStudyContext();

  const {noteId, reference, marker, seenRelated = false,  onReturn = () => setRoute(() => null)} = props;
  const [seenNoteIds] = useState(() => props.seenNoteIds || []);

  const updateNoteAndConfirm = useUpdateNote(true);
  const selectTermRouting = useWorkflowRouting(SelectTerm, Study, updateNoteAndConfirm);
  const relatedStudyRouting = useWorkflowRouting(RelatedStudy, Study);
  const editNote = useCallback((editNoteId: string) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, editNoteId), normalizedNote), {...newNormalizedNote});
    selectTermRouting({noteId: editNoteId, normalized}, {noteId, reference, marker, onReturn})
  }, [marker, noteId, notesIndex, onReturn, reference, selectTermRouting])

  const prepareNext = useCallback(() => {
    setCardStartedAt(Date.now());
    setShowBack(false);

    if (noteId && reference && marker) {
      const next = findNextStudyClozeWithinTerm(noteId, reference, marker, notesIndex, nowMinutes, audioStudy);
      if (next) {
        if (next[0].attributes.schedule.nextDueMinutes > nowMinutes && seenRelated) { 
          onReturn();
          return null;
        }
        return bindSome(next, next => studyDetailsForCloze(next, notesIndex));
      }

      onReturn();
      return null;
    }

    return findNextStudyDetails(language, nowMinutes, notesIndex, audioStudy);
  }, [noteId, reference, marker, language, nowMinutes, notesIndex, audioStudy, onReturn, seenRelated]);

  const studyData = useStudyData();
  const [studyDetails] = useState(prepareNext);
  const answerCloze = useAnswerCloze(notesIndex);
  const readCard = useReadCard(studyDetails);

  const answerFront = useCallback(async (answer: Answer) => {
    await answerCloze(studyDetails, answer);
    setShowBack(false);

    mapSome(studyDetails, studyDetails => {
      relatedStudyRouting({...studyDetails.cloze, seenNoteIds}, {...props, seenRelated: true});
    })
  }, [answerCloze, props, relatedStudyRouting, studyDetails, seenNoteIds]);

  const doUndo = useCallback(async () => {
    await undo();
    prepareNext();
  }, [prepareNext, undo]);

  const doRedo = useCallback(async () => {
    await redo();
    prepareNext();
  }, [prepareNext, redo]);

  const dueTime = withDefault(mapSome(
    studyDetails,
    studyDetails => timeOfMinutes(studyDetails.cloze.attributes.schedule.nextDueMinutes)
  ), 0);

  const lastAnsweredTime = withDefault(mapSome(
    studyDetails,
    studyDetails => timeOfMinutes(studyDetails.cloze.attributes.schedule.lastAnsweredMinutes)
  ), 0);

  const intervalTime = withDefault(mapSome(
    studyDetails,
    studyDetails => timeOfMinutes(studyDetails.cloze.attributes.schedule.intervalMinutes)
  ), 0);

  useKeypresses((key: string) => {
    if (key === " " || key === "f") toggleShowBack();
  }, [toggleShowBack]);

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
              <span className="mh2">経過</span>
              <span className={studyData.status}>{studyData.studied}/{studyData.studied + studyData.due}</span>
              <span className="mh2">{describeDuration(time - cardStartedAt)}</span>

              <WorkflowLinks onReturn={onReturn}>
                { hasUndo ? <SimpleNavLink className="mh1 pa2 br2" onClick={doUndo}>
                  Undo
                </SimpleNavLink> : null }
                { hasRedo ? <SimpleNavLink className="mh1 pa2 br2" onClick={doRedo}>
                  Redo
                </SimpleNavLink> : null }
              </WorkflowLinks>
            </div>

            <div>
              期日: {describeDuration(time - dueTime, false)} <br/>
              期間: {describeDuration(intervalTime)} <br/>
              前回: {describeDuration(time - lastAnsweredTime, false)}
            </div>
          </VCentered>
        </VCenteringContainer>
      </Row>

      <Row stretchRow className="w-100 overflow-y-auto word-wrap">
        <div className="w-100 f3 pv2"
             onClick={(e) => e.target instanceof HTMLButtonElement || e.target instanceof HTMLTextAreaElement ? null : toggleShowBack()}>
          <VCenteringContainer>
            <VCentered>
              <div>

              </div>
              <HideIf hidden={!showBack}>
                <BackSide editNote={editNote} studyDetails={studyDetails} answerFront={answerFront}
                          readCard={readCard}  now={time} studyStarted={cardStartedAt}/>
              </HideIf>
              <HideIf hidden={showBack}>
                <FrontSide readCard={readCard} studyDetails={studyDetails}/>
              </HideIf>
            </VCentered>
          </VCenteringContainer>
        </div>
      </Row>
    </FlexContainer>
  ), null);
}

function useReadCard(studyDetails: Maybe<StudyDetails>) {
  const audioDataUrl = useDataUrl(withDefault(mapSome(studyDetails, d => d.audioFileId), ""));
  const {playAudioInScope, speakInScope} = useSpeechAndAudio();
  const playAudioPath = useCallback(() => {
    return bindSome(studyDetails, studyDetails => {
      return mapSome(audioDataUrl, (url) => playAudioInScope(url, studyDetails.audioStart, studyDetails.audioEnd));
    });
  }, [audioDataUrl, playAudioInScope, studyDetails])

  return useCallback(() => {
    mapSome(studyDetails, studyDetails => {
      if (studyDetails.audioFileId) {
        playAudioPath();
      } else {
        speakInScope(studyDetails.cloze.language, studyDetails.spoken);
      }
    });
  }, [studyDetails, playAudioPath, speakInScope]);
}

function useAnswerCloze(noteIndexes: NoteIndexes) {
  const updateNote = useUpdateNote();

  return useCallback(async (studyDetails: Maybe<StudyDetails>, answer: Answer) => {
    await mapSomeAsync(studyDetails, async studyDetails => {
      const cloze = studyDetails.cloze;
      await mapSomeAsync(findNoteTree(noteIndexes, cloze.noteId), async tree => {
        let normalized = normalizedNote(tree);

        const answers = Indexer.getAllMatching(noteIndexes.clozeAnswers.byNoteIdReferenceMarkerClozeIdxAndAnswerIdx, [
          normalized.id,
          cloze.reference,
          cloze.marker,
          cloze.clozeIdx,
        ])

        if (isWrongAnswer(answer[1])) {
          const wrongStreakLength = answers.reduce((acc: number, next: ClozeAnswer) => isWrongAnswer(next.answer[1]) ?
            acc + 1 :
            0, 0);

          if (wrongStreakLength >= 2) {
            answer[1] = ["d", 0.6, 2.0];
          }
        }

        const schedule = scheduledBy(cloze.attributes.schedule, answer);
        await mapSomeAsync(findTermInNormalizedNote(normalized, cloze.reference, cloze.marker), async term => {
          if (cloze.clozeIdx > term.attributes.clozes.length) return;

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
        });
      });
    })
  }, [noteIndexes, updateNote]);
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

