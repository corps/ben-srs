import React, { useCallback, useState } from 'react';
import { SelectSingle } from './SelectSingle';
import { useToggle } from '../hooks/useToggle';
import { useStudyData } from '../hooks/useStudyData';
import { CircleButton } from './CircleButton';
import { Maybe, some } from '../../shared/maybe';
import { Study } from './Study';
import { useUpdateNote } from '../hooks/useUpdateNote';
import { useWorkflowRouting } from '../hooks/useWorkflowRouting';
import { EditNote } from './EditNote';
import { useFileStorage } from '../hooks/useFileStorage';
import { Search } from './Search';
import { TagsSelector } from './TagsSelector';
import { DenormalizedNote, NoteTree } from '../notes';
import { SelectTerm } from './SelectTerm';
import { NumberTraining } from './NumberTraining';
import { useSession } from '../hooks/useSession';
import { createId } from '../services/storage';
import { useStudyContext } from '../hooks/useStudyContext';
import { useRoute } from '../hooks/useRoute';
import { Tuple } from '../../shared/tuple';

const targets = ['7 Days', '30 Days', '90 Days', '1 Day', 'Slow'];

export function MainMenu({ syncFailed }: { syncFailed: boolean }) {
  const [session] = useSession();
  const [_, setRoute] = useRoute();
  const {
    languages,
    language,
    setLanguage,
    tag,
    setTag,
    audioStudy,
    setAudioStudy
  } = useStudyContext();
  const toggleAudioStudy = useToggle(setAudioStudy);
  const [target, setTarget] = useTarget();
  const studyData = useStudyData();
  const [loggingOut, doLogout] = useLogout();
  const visitNewNote = useVisitNewNote();

  if (loggingOut) return null;

  return (
    <div>
      <div className="tc pt5-ns fw5 mb3">
        <div className="f5 mb2">
          こんにちは,&nbsp;
          {session.user.username}
          <span
            className="ml1 pointer blue hover-light-blue"
            onClick={doLogout}
          >
            (ログアウト)
          </span>
        </div>

        <div className="f5">
          言語:
          <div className="ml2 w4 dib">
            <SelectSingle
              onChange={setLanguage}
              value={language}
              values={languages}
            />
          </div>
        </div>

        <div className="f5">
          目標:
          <div className="ml2 w4 dib">
            <SelectSingle
              onChange={setTarget}
              value={target}
              values={targets}
            />
          </div>
        </div>

        <TagsSelector
          value={[tag]}
          language={language}
          onChange={(vs) => setTag(vs[0])}
          singular
        />

        <div className="f5">
          音声:
          <div className="ml2 w4 dib tl">
            <input
              type="checkbox"
              className="pv2"
              onChange={toggleAudioStudy}
              checked={audioStudy}
            />
          </div>
        </div>
      </div>

      <div className="tc f4 fw2 mb1">
        予定: <span className={studyData.status}>{studyData.due}</span>
      </div>
      {studyData.delayed ? (
        <div className="tc f4 fw2 mb1">休止: {studyData.delayed}</div>
      ) : (
        ''
      )}

      <div className="tc f4 fw4 mb3 red">
        {syncFailed ? <span className="red mr1">オフライン</span> : null}
      </div>

      <div className="tc">
        <div className="mv2">
          <CircleButton
            onClick={() => setRoute(() => some(<Study />))}
            red
            className="mh2 pointer dim"
          >
            <span className="fw6">訓</span>
            <span className="fw3">練</span>
            <br />
            <span className="fw1">開</span>
            <span className="fw4">始</span>
          </CircleButton>

          <CircleButton
            onClick={visitNewNote}
            green
            className="mh2 pointer dim"
          >
            <span className="fw4">新</span>
            <span className="fw2">規</span>
            <br />
            <span className="fw6">追</span>
            <span className="fw3">加</span>
          </CircleButton>
        </div>

        <div className="mv2">
          <CircleButton
            onClick={() => setRoute(() => some(<Search />))}
            yellow
            className="mh2 pointer dim"
          >
            <span className="fw5">検</span>
            <span className="fw1">索</span>
            <br />
          </CircleButton>

          {syncFailed ? (
            <CircleButton
              onClick={() => session.refresh()}
              blue
              className="mh2 pointer dim"
            >
              <span className="fw5">再</span>
              <br />
              <span className="fw1">認</span>
              <span className="fw3">証</span>
            </CircleButton>
          ) : (
            <CircleButton
              onClick={() => setRoute(() => some(<NumberTraining />))}
              purple
              className="mh2 pointer dim"
            >
              <span className="fw5">聞き</span>
              <br />
              <span className="fw1">取り</span>
            </CircleButton>
          )}
        </div>

        <div className="mv2"></div>
      </div>

      <div className="tc f3 fw2 mb1">言葉: {studyData.terms}</div>
      <div className="tc f3 fw2 mb1">合計: {studyData.clozes}</div>
    </div>
  );
}

function useTarget() {
  const { target, setTarget } = useStudyContext();
  const setTargetString = useCallback(
    (target: string) => {
      let result: Maybe<number> = null;
      const parsed = parseInt(target);
      if (!isNaN(parsed)) {
        result = some(parsed);
      }

      setTarget(result);
    },
    [setTarget]
  );

  const targetString = target
    ? `${target[0]} Day${target[0] == 1 ? '' : 's'}`
    : 'Slow';

  return Tuple.from(targetString, setTargetString);
}

function useLogout() {
  const [session] = useSession();
  const storage = useFileStorage();
  const [loggingOut, setLoggingOut] = useState(false);
  const doLogout = useCallback(async () => {
    setLoggingOut(true);
    await session.logout();
    await storage.clear();
    location.reload();
  }, [session, storage]);
  return Tuple.from(loggingOut, doLogout);
}

function useVisitNewNote() {
  const updateNote = useUpdateNote(true);
  const [_, setRoute] = useRoute();
  const selectTermRouting = useWorkflowRouting(SelectTerm, null, updateNote);
  return useCallback(() => {
    const noteId = createId();
    const onFinishEditNote = async (
      tree: Maybe<NoteTree>,
      denormalized: DenormalizedNote
    ) => selectTermRouting({ noteId, denormalized: denormalized }, {});
    setRoute(() =>
      some(<EditNote onApply={onFinishEditNote} noteId={noteId} />)
    );
  }, [selectTermRouting, setRoute]);
}
