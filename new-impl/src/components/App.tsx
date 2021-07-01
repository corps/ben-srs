import React from 'react';
import 'tachyons';
import {backends} from "../services/backends";

export function App() {
  backends.dropbox.loadSession(sessionStorage);

  return <div>
    Hello World!
  </div>
}

