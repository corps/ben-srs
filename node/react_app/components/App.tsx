import React, { useCallback, useState } from 'react';
import 'tachyons';
import '../css/index.css';
import { FileStore, withNamespace } from '../services/storage';
import {
  defaultStudyContext,
  FileStorageContext,
  NotesIndexContext,
  StudyContext,
  TriggerSyncContext
} from '../hooks/contexts';
import { Router } from './Router';
import { indexesInitialState } from '../notes';
import { createDexie } from '../services/dexie';
import {Inject, provide} from "../hooks/useInjected";
import {useLogin, useSession} from "../session";

export function App() {
  const sessionState = useSession();
  const [session, error] = useLogin(sessionState);
  const [fileStorage] = useState(() => new FileStore(createDexie()));
  const [notesIndex] = useState(() => ({ ...indexesInitialState }));
  const [syncIdx, setSyncIdx] = useState(0);
  const triggerSync = useCallback(() => setSyncIdx((i) => i + 1), []);
  const [studyContext, setStudyContext] = useState(defaultStudyContext);

  if (error) console.error(error);
  if (!session) return null;
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="wf-mplus1p">
      <Inject injections={[
          provide(useSession, sessionState),
      ]}>
          <FileStorageContext.Provider value={fileStorage}>
            <NotesIndexContext.Provider value={notesIndex}>
              <TriggerSyncContext.Provider value={[triggerSync, syncIdx]}>
                <StudyContext.Provider value={[studyContext, setStudyContext]}>
                  <Router />
                </StudyContext.Provider>
              </TriggerSyncContext.Provider>
            </NotesIndexContext.Provider>
          </FileStorageContext.Provider>
      </Inject>
    </div>
  );
}
