import { DropboxAuth } from 'dropbox';
import { BensrsClient } from './bensrs';
import { never } from '../utils/delay';

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

async function getDropboxAuthOrLogin(
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
  ) {}

  logout(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }
}
