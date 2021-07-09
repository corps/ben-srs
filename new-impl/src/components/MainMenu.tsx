import React, {Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute, useSession} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {endKeyMatchingWithin, Indexer} from "../utils/indexable";
import {useToggle} from "../hooks/useToggle";
import {useTime} from "../hooks/useTime";
import {useStudyData} from "../hooks/useStudyData";
import {CircleButton} from "./CircleButton";
import {minutesOfTime} from "../utils/time";
import {NormalizedNote, NoteIndexes, NoteTree} from "../notes";
import {mapSome, Maybe, some, withDefault} from "../utils/maybe";
import {Study} from "./Study";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {EditNote} from "./EditNote";
import {createId} from "../services/storage";

export function MainMenu({syncFailed}: { syncFailed: boolean }) {
  const session = useSession();
  const storage = useFileStorage();
  const notesIndex = useNotesIndex();
  const setRoute = useRoute();
  const [loggingOut, setLoggingOut] = useState(false);

  const languages = useMemo(() => {
    const languages: string[] = [];
    for (let i = 0; i < notesIndex.notes.byLanguage[1].length;) {
      const {attributes: {language}} = notesIndex.notes.byLanguage[1][i];
      languages.push(language);
      const {endIdx} = Indexer.getRangeFrom(notesIndex.notes.byLanguage, [language], endKeyMatchingWithin([language]));
      i = endIdx;
    }
    return languages;
  }, [notesIndex.notes.byLanguage]);

  const [language, setLanguage] = useState(() => languages[0]);
  useEffect(() => {
    if (!languages.includes(language)) {
      setLanguage(languages[0]);
    }
  }, [languages, language]);

  const [audioStudy, setAudioStudy] = useState(false);
  const toggleAudioStudy = useToggle(setAudioStudy);
  const time = useTime();

  const updateNote = useUpdateNote();
  const newNoteRouting = useWorkflowRouting(EditNote, MainMenu, updateNote);
  const visitNewNote = useCallback(() => {
    newNoteRouting({
      noteId: createId(),
    }, {syncFailed}, () => ({syncFailed}))
  }, [newNoteRouting, syncFailed]);

  useOptimizeNextStudy(notesIndex, minutesOfTime(time), language, audioStudy, setLanguage, setAudioStudy);

  const studyData = useStudyData(time, language, audioStudy);

  const doLogout = useCallback(async () => {
    setLoggingOut(true);
    await session.logout();
    await storage.clear();
    location.reload();
  }, [session, storage])

  if (loggingOut) return null;

  return <div>
    <div className="tc pt5-ns fw5 mb3">
      <div className="f5 mb2">
        こんにちは,&nbsp;
        {session.user.username}
        <span className="ml1 pointer blue hover-light-blue" onClick={doLogout}>
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
        音声:
        <div className="ml2 w4 dib tl">
          <input type="checkbox" className="pv2"
                 onChange={toggleAudioStudy}
                 checked={audioStudy}
          />
        </div>
      </div>
    </div>

    <div className="tc f4 fw2 mb1">
      予定: {studyData.due} {studyData.new ? "(" + studyData.new + ")" : ""}
    </div>
    {studyData.delayed ? <div className="tc f4 fw2 mb1">休止: {studyData.delayed}</div> : ""}

    <div className="tc f4 fw4 mb3 red">
      {syncFailed ? <span className="red mr1">オフライン</span> : null}
    </div>

    <div className="tc">
      <div className="mv2">
        <CircleButton
          onClick={() => setRoute(() => some(<Study audioStudy={audioStudy} language={language}/>))}
          red
          className="mh2 pointer dim">
          <span className="fw6">訓</span>
          <span className="fw3">練</span>
          <br/>
          <span className="fw1">開</span>
          <span className="fw4">始</span>
        </CircleButton>

        <CircleButton
          onClick={visitNewNote}
          green
          className="mh2 pointer dim">
          <span className="fw4">新</span>
          <span className="fw2">規</span>
          <br/>
          <span className="fw6">追</span>
          <span className="fw3">加</span>
        </CircleButton>
      </div>

      <div className="mv2">
        <CircleButton
          // onClick={() => dispatch(visitEditNote)}
          yellow
          className="mh2 pointer dim">
          <span className="fw3">編</span>
          <span className="fw5">集</span>
        </CircleButton>

        {session.user.needsRefreshAt.getTime() < time ? (<CircleButton
          onClick={() => session.refresh()}
          blue
          className="mh2 pointer dim">
          <span className="fw5">再</span>
          <br/>
          <span className="fw1">認</span>
          <span className="fw3">証</span>
        </CircleButton>) : (<CircleButton
          // onClick={() => dispatch(visitSearch)}
          purple
          className="mh2 pointer dim">
          <span className="fw5">検</span>
          <br/>
          <span className="fw1">索</span>
        </CircleButton>)}
      </div>
    </div>

    <div className="tc f3 fw2 mb1">言葉: {studyData.terms}</div>
    <div className="tc f3 fw2 mb1">合計: {studyData.clozes}</div>
  </div>
}

function useOptimizeNextStudy(noteIndexes: NoteIndexes,
  minutesNow: number,
  language: string,
  audioStudy: boolean,
  setLanguage: Dispatch<SetStateAction<string>>,
  setAudioStudy: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(
    () => {
      let nextDue = Indexer.iterator(noteIndexes.clozes.byLanguageSpokenAndNextDue,
        [language, audioStudy, false],
        [language, audioStudy, true, Infinity]
      )();

      const curLanguageHasDue = withDefault(mapSome(nextDue,
        nextDue => nextDue.attributes.schedule.nextDueMinutes <= minutesNow
      ), false);
      if (curLanguageHasDue) return;

      nextDue = Indexer.reverseIter(noteIndexes.clozes.byNextDue, [true, minutesNow], [true, null])();
      nextDue = nextDue || Indexer.iterator(noteIndexes.clozes.byNextDue)();

      mapSome(nextDue, nextDue => {
        const spoken = nextDue.attributes.type == "listen" || nextDue.attributes.type == "speak";
        setLanguage(nextDue.language);
        setAudioStudy(spoken);
      });
    },
    [
      minutesNow,
      language,
      audioStudy,
      setLanguage,
      setAudioStudy,
      noteIndexes.clozes.byLanguageSpokenAndNextDue,
      noteIndexes.clozes.byNextDue
    ]
  );
}