import {Dropbox, DropboxAuth, files} from "dropbox";
import {defaultUser, Session, User} from "./backends";
import {defaultFileDelta, FileDelta, FileListProgress, FileMetadata, SyncBackend} from "./sync";
import {some} from "../utils/maybe";

export class DropboxSession implements Session {
  constructor(
    private auth: DropboxAuth,
    public user: User,
    private storage: Storage,
    public refresh: () => Promise<Session>,
  ) {
  }

  logout(): Promise<void> {
    this.storage.clear();
    return Promise.resolve(undefined);
  }

  syncBackend(): SyncBackend {
    return new DropboxSyncBackend(new Dropbox({ auth: this.auth }));
  }
}

export class DropboxSyncBackend implements SyncBackend {
  constructor(public db: Dropbox) {
  }

  async downloadBinaryFile(metadata: FileMetadata): Promise<Blob> {
    const { path, rev } = metadata;
    const download = this.db.filesDownload({ rev, path });
    console.log(download);
    return new Blob();
  }

  downloadTextFile(metadata: FileMetadata): Promise<string> {
    return Promise.resolve("");
  }

  syncFileList(cursor: string): Iterable<Promise<FileListProgress>> {
    const {db} = this;

    function* syncFileList() {
      let done = false;
      while (!done) {
        let baseWork;
        if (!cursor) {
          baseWork = db.filesListFolder({
            recursive: true,
            include_deleted: true,
            path: ""
          });
        } else {
          baseWork = db.filesListFolderContinue({
            cursor
          });
        }

        yield baseWork.then(listResponse => {
          cursor = listResponse.result.cursor;
          done = !listResponse.result.has_more;
          return mapDropboxListResponse(listResponse.result);
        })
      }
    }

    return syncFileList();
  }
}

export function mapDropboxMetadata(metadata: files.FileMetadata): FileMetadata {
  const {path_lower: path, rev, size, id, name} = metadata;
  if (path == null) throw new Error('Unexpected filemetadata without path set!');

  return {
    path, rev, size, id
  }
}

export function mapDropboxListResponse(response: files.ListFolderResult): FileListProgress {
  return {
    delta: response.entries.reduce((acc, r) => {
      if (r[".tag"] === "file") {
        acc.push({
          ...defaultFileDelta,
          updated: some(mapDropboxMetadata(r)),
        })
      }

      return acc;
    }, [] as FileDelta[]),
    cursor: response.cursor,
  };
}

export function loadDropboxSession(clientId: string) {
  return async function loadDropboxSession(storage: Storage): Promise<Session> {
    const auth = await getDropboxAuth(clientId, storage);

    let user = {...defaultUser, needsRefreshAt: auth.getAccessTokenExpiresAt() };

    const existingUserName = storage.getItem('username');
    if (existingUserName) {
      user = {...user, username: existingUserName };
    } else {
      const dropbox = new Dropbox({ auth });
      const account = await dropbox.usersGetCurrentAccount();
      const username = account.result.email;

      storage.setItem('username', username);
      user = { ...user, username };
    }

    return new DropboxSession(auth, user, storage, () => loadDropboxSession(storage));
  }
}

export function getDropboxAuth(clientId: string, storage: Storage): Promise<DropboxAuth> {
  const existingToken = storage.getItem('token');
  const existingExpiresAt = storage.getItem('expires');

  if (existingToken && existingExpiresAt) {
    try {
      return Promise.resolve(new DropboxAuth({
        accessToken: existingToken,
        accessTokenExpiresAt: new Date(parseInt(existingExpiresAt, 10)),
      }));
    } catch(e) {
      console.error(e);
    }
  }

  const auth = new DropboxAuth({
    clientId,
  });


  let match;
  if ((match = window.location.search.match(/code=([^&]+)/))) {
    const code = match[1];
    if (code) {
      const verifier = storage.getItem('verifier');
      if (verifier) {
        auth.setCodeVerifier(verifier);

        return auth.getAccessTokenFromCode(window.location.origin + window.location.pathname, code)
          .then((response) => {
            const result: DropboxAccessTokenAuthResponse = response.result as any;
            auth.setAccessToken(result.access_token);
            auth.setAccessTokenExpiresAt(new Date(new Date().getTime() + result.expires_in))
            return auth;
          });
      }

      return Promise.reject('Dropbox authentication failed, code verifier not found in storage!');
    }
  }

  return auth.getAuthenticationUrl(
    window.location.href, undefined, 'code', 'offline', undefined, undefined, true)
    .then(authUrl => {
      storage.clear();
      storage.setItem("verifier", auth.getCodeVerifier());
      window.location.href = authUrl.toString();
      return null as any;
    })
}


export interface DropboxAccessTokenAuthResponse {
  access_token: string,
  uid: string,
  expires_in: number,
  refresh_token: string,
  account_id: string,
}