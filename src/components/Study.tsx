import React, {Dispatch, useCallback, useEffect, useMemo, useState} from 'react';
import {useNotesIndex, useRoute} from "../hooks/contexts";
import {useToggle} from "../hooks/useToggle";
import {useTime} from "../hooks/useTime";
import {
  findNextStudyClozeWithinTerm,
  findNextStudyDetails,
  findTermInNormalizedNote,
  StudyDetails, studyDetailsForCloze
} from "../study";
import {describeDuration, minutesOfTime, timeOfMinutes} from "../utils/time";
import {
  Cloze, ClozeAnswer, ClozeType, findNoteTree, newNormalizedNote, normalizedNote, NoteIndexes, Tagged, Term
} from "../notes";
import {bindSome, mapSome, mapSomeAsync, Maybe, some, withDefault} from "../utils/maybe";
import {playAudio, speak} from "../services/speechAndAudio";
import {useStudyData} from "../hooks/useStudyData";
import {FlexContainer, Row, VCentered, VCenteringContainer} from "./layout-utils";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {Answer, isWrongAnswer, scheduledBy} from "../scheduler";
import {useKeypresses} from "../hooks/useKeypress";
import {BackSide} from "./BackSide";
import {FrontSide} from "./FrontSide";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {SelectTerm} from "./SelectTerm";
import {useDataUrl} from "../hooks/useDataUrl";
import {Indexer} from "../utils/indexable";

interface Props {
  onReturn?: Dispatch<void>,
  language: string,
  audioStudy: boolean,
  noteId?: string,
  reference?: string,
  marker?: string,
}

export function Study(props: Props) {
  const notesIndex = useNotesIndex();
  const [showBack, setShowBack] = useState(false);
  const [showRelated, setShowRelated] = useState(false);
  const toggleShowBack = useToggle(setShowBack);
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const setRoute = useRoute();
  const time = useTime(1000);
  const nowMinutes = minutesOfTime(time);

  const {noteId, reference, marker, language, audioStudy, onReturn = () => setRoute(() => null)} = props;

  const updateNoteAndConfirm = useUpdateNote(true);
  const selectTermRouting = useWorkflowRouting(SelectTerm, Study, updateNoteAndConfirm);
  const editNote = useCallback((noteId: string) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, noteId), normalizedNote), {...newNormalizedNote});
    selectTermRouting({noteId, normalized}, {onReturn, language, audioStudy}, () => ({onReturn, language, audioStudy}))
  }, [audioStudy, language, notesIndex, onReturn, selectTermRouting])
  const [answeredRelated, setAnsweredRelated] = useState([] as unknown[]);

  const prepareNext = useCallback(() => {
    setCardStartedAt(Date.now());
    setShowBack(false);
    setShowRelated(false);
    setAnsweredRelated([]);

    if (noteId && reference && marker) {
      const next = findNextStudyClozeWithinTerm(noteId, reference, marker, notesIndex, nowMinutes);
      if (next) {
        return bindSome(next, next => studyDetailsForCloze(next, notesIndex));
      }

      onReturn();
      return null;
    }

    return findNextStudyDetails(language, nowMinutes, notesIndex, audioStudy);
  }, [noteId, reference, marker, language, nowMinutes, notesIndex, audioStudy, onReturn]);
  const studyData = useStudyData(time, language, audioStudy);
  const [studyDetails, setStudyDetails] = useState(prepareNext);
  const startNext = useCallback(() => setStudyDetails(prepareNext()), [setStudyDetails, prepareNext]);
  const answerCloze = useAnswerCloze(notesIndex);
  const readCard = useReadCard(studyDetails);

  const allRelatedWithSource = useMemo(() => {
    return withDefault(mapSome(studyDetails, studyDetails => {
      const resultsWithScore: [number, [StudyDetails, Term]][] = [];

      studyDetails.noteTree.terms.forEach(term => {
        const thisRef = term.attributes.reference;
        const iter = Indexer.reverseIter(
          notesIndex.taggedClozes.byTagSpokenReferenceAndNextDue,
          [language, false, thisRef, nowMinutes],
          [language, false, thisRef.slice(0, 1), null],
        );

        let nextRelated: Maybe<Tagged<Cloze>>;
        let lastScore = 0;
        let curScoreResults: [number, [StudyDetails, Term]][] = [];

        while (nextRelated = iter()) {
          mapSome(nextRelated, nextRelated => {
            const nextTerm = nextRelated.inner;
            // If it's on the same note, it is not 'related'.
            if (nextTerm.noteId == studyDetails.noteTree.note.id) return;
            if (nextTerm.attributes.type == "produce") return;
            if (nextTerm.attributes.type == "flash") return;
            const maybeRelated = studyDetailsForCloze(nextTerm, notesIndex);
            const nextRef = nextTerm.reference;

            if (nextRef !== thisRef && thisRef.length === 1) {
              return;
            }

            let i = 0;
            for (; i < nextRef.length && i < thisRef.length; ++i) {
              if (nextRef[i] !== thisRef[i]) break;
            }

            let score = thisRef.length - i;
            if (score !== lastScore) {
              lastScore = score;
              if (curScoreResults.length < 3) {
                resultsWithScore.push(...curScoreResults);
                curScoreResults = [];
              }
            }

            score -= term.attributes.reference === studyDetails.cloze.reference ? 0.5 : 0;
            if (nextRef.length > thisRef.length) score += (nextRef.length - thisRef.length) * 0.5;

            mapSome(maybeRelated, r => curScoreResults.push([score, [r, term]]));
          });
        }

        if (curScoreResults.length < 3) {
          resultsWithScore.push(...curScoreResults);
        }
      });

      resultsWithScore.sort(([a], [b]) => a - b);

      return resultsWithScore.map(([_, a]) => a);
    }), [])
  }, [language, notesIndex, studyDetails, nowMinutes])

  const allRelated = useMemo(
    () => allRelatedWithSource.map(([a]) => a),
    [allRelatedWithSource]
  );

  const answerFront = useCallback(async (answer: Answer) => {
    await answerCloze(studyDetails, answer);
    if (allRelated.length === 0 || withDefault(mapSome(studyDetails,
        sd => !['produce', 'recognize'].includes(sd.cloze.attributes.type)), false)) {
      startNext();
    } else {
      setShowRelated(true);
      setShowBack(true);
    }
  }, [allRelated.length, answerCloze, startNext, studyDetails]);

  const answerRelated = useCallback(async (sd: StudyDetails, answer: Answer) => {
    await answerCloze(some(sd), answer);
    setAnsweredRelated(answered => [...answered, sd]);
  }, [answerCloze])

  const unAnsweredRelated = useMemo(
    () => allRelatedWithSource.filter(([v]) => !answeredRelated.includes(v)),
    [allRelatedWithSource, answeredRelated]);

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
    if (key === "a") mapSome(studyDetails, studyDetails => answerFront(answerOk(time, cardStartedAt, studyDetails)));
    if (key === "s") mapSome(studyDetails, studyDetails => answerFront(answerMiss(time)));
    if (key === "d") mapSome(studyDetails, studyDetails => answerFront(answerSkip(time)));
    if (key === "j") mapSome(studyDetails, studyDetails => readCard());
  }, [toggleShowBack, time, cardStartedAt, studyDetails, answerCloze]);

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
              {studyData.studied}/{studyData.studied + studyData.due}
              <span className="mh2">{describeDuration(time - cardStartedAt)}</span>

              <WorkflowLinks onReturn={onReturn} />
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
                <BackSide editNote={editNote} studyDetails={studyDetails} answerMain={answerFront}
                          answerRelated={answerRelated} readCard={readCard} unAnsweredRelated={unAnsweredRelated}
                          startNext={startNext} showRelated={showRelated} now={time} studyStarted={cardStartedAt}/> :
                <FrontSide readCard={readCard} studyDetails={studyDetails}/>}
            </VCentered>
          </VCenteringContainer>
        </div>
      </Row>
    </FlexContainer>
  ), null);
}

function useReadCard(studyDetails: Maybe<StudyDetails>) {
  const audioDataUrl = useDataUrl(withDefault(mapSome(studyDetails, d => d.audioFileId), ""));
  const playAudioPath = useCallback(() => {
    mapSome(audioDataUrl, playAudio);
  }, [audioDataUrl])

  return useCallback(() => {
    mapSome(studyDetails, studyDetails => {
      if (studyDetails.audioFileId) {
        playAudioPath();
      } else {
        speak(studyDetails.cloze.language, studyDetails.spoken);
      }
    });
  }, [studyDetails, playAudioPath]);
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

    case "flash":
      return timeToAnswer <= 4000 ? 3.0 : 2.0;
  }

  return 1;
}
