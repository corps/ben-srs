import { makeContextual } from './makeContextual';
import React, { PropsWithChildren, useState } from 'react';
import { defaultUser, Session } from '../services/session';
import { DropboxAuth } from 'dropbox';
import { State } from './useStateEx';
import { useLogin } from './useLogin';

export const [useSession, _SessionContext] = makeContextual<State<Session>>(
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

export function SessionContext({ children }: PropsWithChildren<{}>) {
  function WithContext() {
    const sessionState = useSession();
    const [session, error] = useLogin(sessionState);

    if (error) console.error(error);
    if (!session) return null;
    if (error) {
      return <div>{error}</div>;
    }
    return <>{children}</>;
  }

  return (
    <_SessionContext>
      <WithContext />
    </_SessionContext>
  );
}
