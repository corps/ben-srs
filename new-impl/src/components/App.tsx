import React, {useState} from 'react';
import 'tachyons';
import {useLogin} from "../hooks/useLogin";
import {FileStore, withNamespace} from "../services/storage";
import {FileStorageContext, NotesIndexContext, SessionContext} from "../hooks/contexts";
import Dexie from "dexie";
import {NotesIndex} from "../notes";
import {Router} from "./Router";

const loginStorage = withNamespace(localStorage, "dropboxLogin");

export function App() {
  const [session, error] = useLogin(loginStorage);
  const [fileStorage] = useState(() => new FileStore(new Dexie("benSrsNew")))
  const [notesIndex] = useState(() => new NotesIndex())
  if (!session) return null;
  if (error) {
    return <div>{error}</div>
  }

  return <div>
    <SessionContext.Provider value={session[0]}>
      <FileStorageContext.Provider value={fileStorage}>
        <NotesIndexContext.Provider value={notesIndex}>
          <Router/>
        </NotesIndexContext.Provider>
      </FileStorageContext.Provider>
    </SessionContext.Provider>
  </div>
}

