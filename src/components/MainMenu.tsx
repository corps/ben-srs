import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute, useSession} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {endKeyMatchingWithin, Indexer} from "../utils/indexable";
import {useToggle} from "../hooks/useToggle";
import {useTime} from "../hooks/useTime";
import {useStudyData} from "../hooks/useStudyData";
import {CircleButton} from "./CircleButton";
import {some} from "../utils/maybe";
import {Study} from "./Study";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {EditNote} from "./EditNote";
import {createId} from "../services/storage";
import {Search} from "./Search";
import {TagsSelector, useAllTags} from "./TagsSelector";

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
  const allTags = useAllTags(language, true);

  const [tag, setTag] = useState(() => language);

  useEffect(() => {
    if (!languages.includes(language)) {
      setLanguage(languages[0]);
    }
    if (!allTags.includes(tag)) {
      setTag(allTags[0] || language);
    }
  }, [languages, language, allTags, tag]);

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

  const studyData = useStudyData(time, tag, audioStudy);

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

      <TagsSelector value={[tag]} language={language} onChange={(vs) => setTag(vs[0])} singular/>

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
          onClick={() => setRoute(() => some(<Study audioStudy={audioStudy} language={tag}/>))}
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
        onClick={() => setRoute(() => some(<Search/>))}
          yellow
          className="mh2 pointer dim">
          <span className="fw5">検</span>
          <span className="fw1">索</span>
          <br/>
        </CircleButton>

        { session.user.needsRefreshAt.getTime() < time || syncFailed ? <CircleButton
          onClick={() => session.refresh()}
          blue
          className="mh2 pointer dim">
          <span className="fw5">再</span>
          <br/>
          <span className="fw1">認</span>
          <span className="fw3">証</span>
        </CircleButton> : null }
      </div>
    </div>

    <div className="tc f3 fw2 mb1">言葉: {studyData.terms}</div>
    <div className="tc f3 fw2 mb1">合計: {studyData.clozes}</div>
  </div>
}