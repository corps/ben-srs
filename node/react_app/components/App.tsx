import React from 'react';
import 'tachyons';
import '../css/index.css';
import { Router } from './Router';
import { SessionContext } from '../hooks/useSession';
import { FileStorageContext } from '../hooks/useFileStorage';
import { joinContext } from '../utils/react-tools';
import { NotesIndexContext } from '../hooks/useNotesIndex';
import { StudyContext } from '../hooks/useStudyContext';
import { RouteContext } from '../hooks/useRoute';
import {NoteLoaderContext} from "../hooks/useNoteLoader";
import {SyncContext} from "../hooks/useSync";

export function App() {
  return (
    <div className="wf-mplus1p">
      {joinContext(
        <Router />,
          StudyContext,
          RouteContext,
          SyncContext,
          SessionContext,
          NoteLoaderContext,
          FileStorageContext,
          NotesIndexContext,
      )}
    </div>
  );
}
