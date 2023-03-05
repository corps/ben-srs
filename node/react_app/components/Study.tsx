import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState
} from 'react';
import { useToggle } from '../hooks/useToggle';
import { useTime } from '../hooks/useTime';
import {
  answerStudy,
  findNextStudyClozeWithinTerm,
  findNextStudyDetails,
  okAnswerFactor,
  StudyDetails,
  studyDetailsForCloze
} from '../study';
import { describeDuration, minutesOfTime, timeOfMinutes } from '../utils/time';
import { TermIdentifier } from '../notes';
import {
  bindSome,
  mapSome,
  mapSomeAsync,
  Maybe,
  some,
  withDefault
} from '../../shared/maybe';
import { useStudyData } from '../hooks/useStudyData';
import {
  FlexContainer,
  Row,
  VCentered,
  VCenteringContainer
} from './layout-utils';
import { WorkflowLinks } from './SimpleNavLink';
import { Answer } from '../../shared/scheduler';
import { useKeypresses } from '../hooks/useKeypress';
import { BackSide } from './BackSide';
import { FrontSide } from './FrontSide';
import { useUpdateNote } from '../hooks/useUpdateNote';
import { useDataUrl } from '../hooks/useDataUrl';
import { Indexer } from '../../shared/indexable';
import { RelatedStudy } from './RelatedStudy';
import { HideIf } from './HideIf';
import { useSpeechAndAudio } from '../hooks/useSpeechAndAudio';
import { useNotesIndex } from '../hooks/useNotesIndex';
import { useStudyContext } from '../hooks/useStudyContext';
import { useRoute } from '../hooks/useRoute';

interface Props {
  onReturn?: Dispatch<void>;
  termId?: TermIdentifier;
  reference?: string;
  seenTermIds?: TermIdentifier[];
}

export function Study(props: Props) {
  const [showBack, setShowBack] = useState(false);
  const toggleShowBack = useToggle(setShowBack);
  const [_, setRoute] = useRoute();
  const time = useTime(1000);
  const { onReturn = () => setRoute(() => null) } = props;
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const prepareNext = usePrepareNext(
    props,
    setCardStartedAt,
    setShowBack,
    onReturn
  );
  const studyData = useStudyData();
  const [studyDetails] = useState(prepareNext);
  const readCard = useReadCard(studyDetails);
  const answerFront = useAnswerFront(studyDetails, setShowBack, props);
  const { dueTime, lastAnsweredTime, intervalTime } =
    useTimingData(studyDetails);

  useKeypresses(
    (key: string) => {
      if (key === ' ' || key === 'f') toggleShowBack();
    },
    [toggleShowBack]
  );

  useEffect(() => {
    if (!studyDetails) onReturn();
  }, [studyDetails, onReturn]);

  return withDefault(
    mapSome(studyDetails, (studyDetails) => (
      <FlexContainer
        vertical
        className="vh-100 overflow-x-hidden overflow-y-hidden"
      >
        <Row fixedRow className="h3 w-100">
          <VCenteringContainer>
            <VCentered className="tc">
              <div>
                <span className="mh2">経過</span>
                <span className={studyData.status}>
                  {studyData.studied}/{studyData.studied + studyData.due}
                </span>
                <span className="mh2">
                  {describeDuration(time - cardStartedAt)}
                </span>

                <WorkflowLinks onReturn={onReturn} />
              </div>

              <div>
                期日: {describeDuration(time - dueTime, false)} <br />
                期間: {describeDuration(intervalTime)} <br />
                前回: {describeDuration(time - lastAnsweredTime, false)}
              </div>
            </VCentered>
          </VCenteringContainer>
        </Row>

        <Row stretchRow className="w-100 overflow-y-auto word-wrap">
          <div
            className="w-100 f3 pv2"
            onClick={(e) =>
              e.target instanceof HTMLButtonElement ||
              e.target instanceof HTMLTextAreaElement
                ? null
                : toggleShowBack()
            }
          >
            <VCenteringContainer>
              <VCentered>
                <div></div>
                <HideIf hidden={!showBack}>
                  <BackSide
                    studyDetails={studyDetails}
                    answerFront={answerFront}
                    readCard={readCard}
                    now={time}
                    studyStarted={cardStartedAt}
                  />
                </HideIf>
                <HideIf hidden={showBack}>
                  <FrontSide readCard={readCard} studyDetails={studyDetails} />
                </HideIf>
              </VCentered>
            </VCenteringContainer>
          </div>
        </Row>
      </FlexContainer>
    )),
    null
  );
}

function useReadCard(studyDetails: Maybe<StudyDetails>) {
  const audioDataUrl = useDataUrl(
    withDefault(
      mapSome(studyDetails, (d) => d.audioFileId),
      ''
    )
  );
  const { playAudioInScope, speakInScope } = useSpeechAndAudio();
  const playAudioPath = useCallback(() => {
    return bindSome(studyDetails, (studyDetails) => {
      return mapSome(audioDataUrl, (url) =>
        playAudioInScope(url, studyDetails.audioStart, studyDetails.audioEnd)
      );
    });
  }, [audioDataUrl, playAudioInScope, studyDetails]);

  return useCallback(() => {
    mapSome(studyDetails, (studyDetails) => {
      if (studyDetails.audioFileId) {
        playAudioPath();
      } else {
        speakInScope(studyDetails.cloze.language, studyDetails.spoken);
      }
    });
  }, [studyDetails, playAudioPath, speakInScope]);
}

function useAnswerFront(
  studyDetails: Maybe<StudyDetails>,
  setShowBack: Dispatch<SetStateAction<boolean>>,
  props: Props
) {
  const answerCloze = useAnswerCloze();
  const [_, setRoute] = useRoute();
  const { seenTermIds = [] } = props;

  return useCallback(
    async (answer: Answer) => {
      await answerCloze(studyDetails, answer);
      setShowBack(false);

      mapSome(studyDetails, (studyDetails) => {
        let nextTermIds = seenTermIds;
        if (!props.reference && !props.termId) {
          nextTermIds = [...seenTermIds, studyDetails.cloze];
        }

        setRoute((curRoute) => {
          let onReturn = () => setRoute(() => curRoute);
          if (props.reference || props.termId) onReturn = props.onReturn;
          return some(
            <RelatedStudy
              onReturn={onReturn}
              seenTermIds={nextTermIds}
              {...studyDetails.cloze}
            />
          );
        });
      });
    },
    [
      answerCloze,
      studyDetails,
      setShowBack,
      seenTermIds,
      props.reference,
      props.termId,
      props.onReturn,
      setRoute
    ]
  );
}

function useAnswerCloze() {
  const [noteIndexes] = useNotesIndex();
  const updateNote = useUpdateNote();

  return useCallback(
    async (studyDetails: Maybe<StudyDetails>, answer: Answer) => {
      await mapSomeAsync(studyDetails, async (studyDetails) => {
        const cloze = studyDetails.cloze;
        await mapSomeAsync(
          answerStudy(cloze, answer, noteIndexes),
          async ([tree, normalized]) => {
            await updateNote(some(tree), normalized);
          }
        );
      });
    },
    [noteIndexes, updateNote]
  );
}

export function answerOk(
  now: number,
  studyStarted: number,
  studyDetails: StudyDetails
): Answer {
  const timeToAnswer = now - studyStarted;
  return [
    minutesOfTime(now),
    ['f', okAnswerFactor(timeToAnswer, studyDetails.type)]
  ];
}

export function answerMiss(now: number): Answer {
  return [minutesOfTime(now), ['f', 0.6]];
}

export function answerSkip(now: number): Answer {
  return [minutesOfTime(now), ['d', 0.6, 2.0]];
}

function prepareNextFromTermId(
  term: TermIdentifier,
  notesIndex,
  nowMinutes: number,
  audioStudy
) {
  const { noteId, reference, marker } = term;
  const next = findNextStudyClozeWithinTerm(
    noteId,
    reference,
    marker,
    notesIndex,
    nowMinutes,
    audioStudy
  );
  if (next) {
    return bindSome(next, (next) => studyDetailsForCloze(next, notesIndex));
  }

  return null;
}

function prepareNextFromReference(
  notesIndex,
  language,
  reference: string,
  audioStudy
) {
  let next = Indexer.iterator(
    notesIndex.taggedClozes.byTagSpokenReferenceAndNextDue,
    [language, false, reference]
  )();
  if (!next && audioStudy) {
    Indexer.iterator(notesIndex.taggedClozes.byTagSpokenReferenceAndNextDue, [
      language,
      true,
      reference
    ])();
  }

  if (next) {
    return bindSome(next, ({ inner }) =>
      studyDetailsForCloze(inner, notesIndex)
    );
  }

  return null;
}

function usePrepareNext(
  props: Props,
  setCardStartedAt: Dispatch<SetStateAction<number>>,
  setShowBack: Dispatch<SetStateAction<boolean>>,
  onReturn: Dispatch<void>
) {
  const { tag: language, audioStudy } = useStudyContext();
  const { termId, reference = '' } = props;
  const [notesIndex] = useNotesIndex();
  const time = useTime(1000);
  const nowMinutes = minutesOfTime(time);

  return useCallback(
    function prepareNext() {
      setCardStartedAt(Date.now());
      setShowBack(false);

      if (termId) {
        const result = prepareNextFromTermId(
          termId,
          notesIndex,
          nowMinutes,
          audioStudy
        );
        if (!result) {
          onReturn();
          return;
        }
        return result;
      }

      if (reference) {
        const result = prepareNextFromReference(
          notesIndex,
          language,
          reference,
          audioStudy
        );
        if (!result) {
          onReturn();
          return;
        }
        return result;
      }

      return findNextStudyDetails(language, nowMinutes, notesIndex, audioStudy);
    },
    [
      setCardStartedAt,
      setShowBack,
      termId,
      reference,
      language,
      nowMinutes,
      notesIndex,
      audioStudy,
      onReturn
    ]
  );
}

function useTimingData(studyDetails: Maybe<StudyDetails>) {
  const dueTime = withDefault(
    mapSome(studyDetails, (studyDetails) =>
      timeOfMinutes(studyDetails.cloze.attributes.schedule.nextDueMinutes)
    ),
    0
  );

  const lastAnsweredTime = withDefault(
    mapSome(studyDetails, (studyDetails) =>
      timeOfMinutes(studyDetails.cloze.attributes.schedule.lastAnsweredMinutes)
    ),
    0
  );

  const intervalTime = withDefault(
    mapSome(studyDetails, (studyDetails) =>
      timeOfMinutes(studyDetails.cloze.attributes.schedule.intervalMinutes)
    ),
    0
  );
  return { dueTime, lastAnsweredTime, intervalTime };
}
