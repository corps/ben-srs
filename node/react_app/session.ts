import {withNamespace} from "./services/storage";
import {useMemo, useState} from "react";
import {useInjected} from "./hooks/useInjected";
import {useAsync} from "./hooks/useWithContext";
import {runPromise} from "./cancellable";
import {DropboxAuth} from "dropbox";
import {BensrsClient} from "./services/bensrs";
import {never} from "./utils/delay";
import {State} from "./hooks/makeRider";

export function useLoginStorage(): Storage {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useInjected(useLoginStorage, () => useMemo(
      () => withNamespace(localStorage, 'dropboxLogin'), []));
}

export function useLogin([_, setSession]: State<Session>) {
  const storage = useLoginStorage();
  const bensrs = useBensrsClient();

  return useAsync(function* () {
    const newSession = yield* runPromise(loadDropboxSession(storage, bensrs));
    setSession(newSession)
    return newSession
  }, [storage, setSession]);
}

export const defaultUser = {
  username: ''
};

export async function loadDropboxSession(
    storage: Storage,
    bensrs: BensrsClient,
    force = false
): Promise<Session> {
  const auth = await getDropboxAuthOrLogin(storage, bensrs, force);

  let user = { ...defaultUser };
  const existingUserName = storage.getItem('username');
  if (existingUserName) {
    user = { ...user, username: existingUserName };
  } else {
    return loadDropboxSession(storage, bensrs, true);
  }

  return new Session(auth, user, storage, () =>
      loadDropboxSession(storage, bensrs, true)
  );
}

export function useBensrsClient() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useInjected(useBensrsClient, () => useMemo(() => new BensrsClient(), []))
}

export async function getDropboxAuthOrLogin(
    storage: Storage,
    bensrs: BensrsClient,
    force = false
): Promise<DropboxAuth> {
  const existingToken = storage.getItem('token');
  const existingAppKey = storage.getItem('key');


  if (!force) {
    try {
      const { success, ...auth } = await bensrs.callJson(
          BensrsClient.LoginEndpoint,
          {}
      );

      if (success && 'access_token' in auth) {
        storage.setItem('username', auth.email || '');
        storage.setItem('token', auth.access_token || '');
        storage.setItem('key', auth.app_key || '');
        return new DropboxAuth({
          accessToken: auth.access_token,
          clientId: auth.app_key
        });
      }
    } catch (e) {
      return new DropboxAuth({
        accessToken: existingToken || '',
        clientId: existingAppKey || ''
      });
    }
  }

  window.location.href = bensrs.startUrl();
  await never(); // prevents safari from going crazy, this really only exists to satisfy type system.
  return new DropboxAuth();
}

export type User = typeof defaultUser;

export class Session {
  constructor(
      public auth: DropboxAuth,
      public user: User,
      private storage: Storage,
      public refresh: () => Promise<Session>
  ) {
  }

  logout(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }
}

export function useSession(): State<Session> {
  return useInjected(useSession, () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [v, setV] = useState(() => new Session(new DropboxAuth(), defaultUser, sessionStorage, async () => v));
    return [v, setV];
  })
}