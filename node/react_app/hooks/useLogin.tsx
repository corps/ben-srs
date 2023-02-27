import { State } from './useStateEx';
import { loadDropboxSession, Session } from '../services/session';
import { withNamespace } from '../services/storage';
import { useMemo } from 'react';
import { createBensrsClient } from '../services/services';
import { useAsync } from './useWithContext';
import { runPromise } from '../cancellable';

export function useLogin([_, setSession]: State<Session>) {
  const storage = useMemo(
    () => withNamespace(localStorage, 'dropboxLogin'),
    []
  );
  const bensrs = useMemo(() => createBensrsClient(), []);

  return useAsync(
    function* () {
      const newSession = yield* runPromise(loadDropboxSession(storage, bensrs));
      setSession(newSession);
      return newSession;
    },
    [storage, setSession]
  );
}
