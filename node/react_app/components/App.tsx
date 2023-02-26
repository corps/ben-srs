import React from 'react';
import 'tachyons';
import '../css/index.css';
import { Router } from './Router';
import { SessionContext, useSession } from '../hooks/useSession';
import { useLogin } from '../hooks/useLogin';
import { FileStorageContext } from '../hooks/useFileStorage';
import { joinContext } from '../utils/react-tools';
import { NotesIndexContext } from '../hooks/useNotesIndex';
import { TriggerSyncContext } from '../hooks/useTriggerSync';
import { StudyContext } from '../hooks/useStudyContext';
import { RouteContext } from '../hooks/useRoute';

export function App() {
  function WithSession() {
    const sessionState = useSession();
    const [session, error] = useLogin(sessionState);

    if (error) console.error(error);
    if (!session) return null;
    if (error) {
      return <div>{error}</div>;
    }

    return <Router />;
  }

  return (
    <div className="wf-mplus1p">
      {joinContext(
        <WithSession />,
        RouteContext,
        SessionContext,
        FileStorageContext,
        NotesIndexContext,
        TriggerSyncContext,
        StudyContext
      )}
    </div>
  );
}
