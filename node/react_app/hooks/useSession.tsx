import { makeContextual } from './makeContextual';
import { useState } from 'react';
import { defaultUser, Session } from '../services/session';
import { DropboxAuth } from 'dropbox';
import { State } from './makeRider';

export const [useSession, SessionContext] = makeContextual<State<Session>>(
  function useSession() {
    const [v, setV] = useState(
      () =>
        new Session(
          new DropboxAuth(),
          defaultUser,
          sessionStorage,
          async () => v
        )
    );
    return [v, setV];
  }
);
