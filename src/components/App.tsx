import React, {useState} from 'react';
import 'tachyons';
import '../css/index.css';
import {useLogin} from "../hooks/useLogin";
import {FileStore, withNamespace} from "../services/storage";
import {FileStorageContext, NotesIndexContext, SessionContext} from "../hooks/contexts";
import Dexie from "dexie";
import {Router} from "./Router";
import {indexesInitialState} from "../notes";
import {createDexie} from "../services/dexie";

const loginStorage = withNamespace(localStorage, "dropboxLogin");

export function App() {
  const [session, error] = useLogin(loginStorage);
  const [fileStorage] = useState(() => new FileStore(createDexie()))
  const [notesIndex] = useState(() => ({...indexesInitialState}));
  if (!session) return null;
  if (error) {
    return <div>{error}</div>
  }

  return <div className="wf-mplus1p">
    <SessionContext.Provider value={session[0]}>
      <FileStorageContext.Provider value={fileStorage}>
        <NotesIndexContext.Provider value={notesIndex}>
          <Router/>
        </NotesIndexContext.Provider>
      </FileStorageContext.Provider>
    </SessionContext.Provider>
  </div>
}
