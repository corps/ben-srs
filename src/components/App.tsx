import React, {useCallback, useState} from 'react';
import 'tachyons';
import '../css/index.css';
import {useLogin} from "../hooks/useLogin";
import {FileStore, withNamespace} from "../services/storage";
import {defaultStudyContext, FileStorageContext, NotesIndexContext, SessionContext, StudyContext, TriggerSyncContext} from "../hooks/contexts";
import {Router} from "./Router";
import {indexesInitialState} from "../notes";
import {createDexie} from "../services/dexie";
import {NoteUpdateHistory, UpdateHistoryContext} from "../hooks/useUpdateNote";

const loginStorage = withNamespace(localStorage, "dropboxLogin");

export function App() {
  const [session, error] = useLogin(loginStorage);
  const [fileStorage] = useState(() => new FileStore(createDexie()))
  const [notesIndex] = useState(() => ({...indexesInitialState}));
  const [syncIdx, setSyncIdx] = useState(0);
  const triggerSync = useCallback(() => setSyncIdx(i => i + 1), []);
  const [updateHistory, setUpdateHistory] = useState<NoteUpdateHistory>([null, null]);
  const [studyContext, setStudyContext] = useState(defaultStudyContext);

  if (!session) return null;
  if (error) {
    return <div>{error}</div>
  }

  return <div className="wf-mplus1p">
    <UpdateHistoryContext.Provider value={{updateHistory, setUpdateHistory}}>
      <SessionContext.Provider value={session[0]}>
        <FileStorageContext.Provider value={fileStorage}>
          <NotesIndexContext.Provider value={notesIndex}>
            <TriggerSyncContext.Provider value={[triggerSync, syncIdx]}>
              <StudyContext.Provider value={[studyContext, setStudyContext]}>
                <Router/>
              </StudyContext.Provider>
            </TriggerSyncContext.Provider>
          </NotesIndexContext.Provider>
        </FileStorageContext.Provider>
      </SessionContext.Provider>
    </UpdateHistoryContext.Provider>
  </div>
}
