import 'regenerator-runtime';
import {Dropbox, DropboxAuth, DropboxResponseError, files} from "dropbox";
import {defaultUser, Session, User} from "./backends";
import {defaultFileDelta, FileDelta, FileListProgress, FileMetadata, SyncBackend} from "./sync";
import {some} from "../utils/maybe";
import {withRetries} from "../utils/retryable";
import {DynamicRateLimitQueue, GatingException} from "../utils/rate-limiting";
import {normalizeBlob, StoredMedia} from "./storage";

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
  requestQ = new DynamicRateLimitQueue();

  constructor(public db: Dropbox) {
  }

  async deleteFile(metadata: FileMetadata) {
    if (!metadata.rev) return;
    await this.db.filesDeleteV2({path: metadata.path, parent_rev: metadata.rev}).catch(error => {
      if ('status' in error && error.status === 409) {
        return null;
      }

      throw error;
    });
  }

  async handleRetry<T>(fn: () => Promise<T>): Promise<T> {
    return await withRetries(fn, (e) => {
      if ('status' in e) {
        return e.status >= 500 ? 1 : 0;
      }

      return e instanceof GatingException ? -1 : 0;
    })
  }

  async handleRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      if ('status' in e) {
        if (e.status === 429) {
          if (e.headers['Retry-After']) {
            const until = Date.now() + parseInt(e.headers['Retry-After'], 10);
            throw new GatingException(until, e);
          }
        }
      }

      throw e;
    }
  }

  downloadFiles(metadata: FileMetadata[]): Iterable<[Promise<[FileMetadata, Blob]>[], Promise<void>]> {
    const {requestQ} = this;

    const requestDownload = (rev: string, path: string): Promise<Blob> => {
        return this.handleRetry(async () => {
          await requestQ.ungated();
          return this.handleRateLimit(async () => {
            const {result} = await this.db.filesDownload({ rev, path });
            return (result as any).fileBlob;
          })
        });
    }

    function* downloadFiles() {
        const remainingMetadatas = [...metadata];
        while (remainingMetadatas.length) {
          const [triggers, promises] = requestQ.ready<[FileMetadata, Blob]>(remainingMetadatas.length);

          triggers.forEach(trigger => {
            const next = remainingMetadatas.pop();
            if (next) {
              const {rev, path} = next;
              requestDownload(rev, path).then(blob => [next, blob] as [FileMetadata, Blob]).then(trigger.resolve, trigger.reject);
            }
          })

          yield [promises, requestQ.ungated()] as [Promise<[FileMetadata, Blob]>[], Promise<void>]
        }
      }

    return downloadFiles();
  }

  syncFileList(cursor: string): Iterable<Promise<FileListProgress>> {
    const {db} = this;

    const makeRequest = <T>(fn: () => Promise<T>) => {
      return this.handleRetry(() => this.handleRateLimit(fn));
    }

    function* syncFileList() {
      let done = false;
      while (!done) {
        let baseWork;
        if (!cursor) {
          baseWork = makeRequest(() => db.filesListFolder({
            recursive: true,
            include_deleted: true,
            limit: 50,
            path: ""
          }));
        } else {
          baseWork = makeRequest(() => db.filesListFolderContinue({
            cursor
          }));
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

  uploadFile(media: StoredMedia): Iterable<Promise<any>> {
    const {db} = this;

    function* uploadFile() {
      yield db.filesUpload({
        contents: normalizeBlob(media.blob),
        path: media.path,
        mode: media.rev ? {'.tag': "update", update: media.rev} : {'.tag': 'add'},
      }).then(() => null, error => {
        if ('status' in error && error.status === 409) {
          return null;
        }

        throw error;
      })
    }

    return uploadFile();
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
  return async function loadDropboxSession(storage: Storage, force = false): Promise<Session> {
    const auth = await getDropboxAuthOrLogin(clientId, storage, force);

    let user = {...defaultUser, needsRefreshAt: auth.getAccessTokenExpiresAt() };
    const existingUserName = storage.getItem('username');
    if (existingUserName) {
      user = {...user, username: existingUserName };
    } else {
      return loadDropboxSession(storage, true);
    }

    return new DropboxSession(auth, user, storage, () => loadDropboxSession(storage, true));
  }
}

export async function getDropboxAuthOrLogin(clientId: string, storage: Storage, force = false): Promise<DropboxAuth> {
  const existingToken = storage.getItem('token');
  const existingExpiresAt = storage.getItem('expires');

  if (!force && existingToken && existingExpiresAt) {
    const expiresAt = parseInt(existingExpiresAt, 10);
    return new DropboxAuth({
      accessToken: existingToken,
      accessTokenExpiresAt: new Date(expiresAt),
      clientId,
    });
  }

  const auth = new DropboxAuth({
    clientId,
  });

  let match;
  if ((match = window.location.search.match(/code=([^&]+)/))) {
    const code = match[1];
    if (code) {
      try {
        const verifier = storage.getItem('verifier');
        if (verifier) {
          auth.setCodeVerifier(verifier);

          const response = await auth.getAccessTokenFromCode(window.location.origin + window.location.pathname, code);
          const result: DropboxAccessTokenAuthResponse = response.result as any;
          auth.setAccessToken(result.access_token);
          auth.setAccessTokenExpiresAt(new Date(new Date().getTime() + result.expires_in * 1000))

          storage.setItem('token', result.access_token);
          storage.setItem('expires', auth.getAccessTokenExpiresAt().getTime() + "");

          const dropbox = new Dropbox({ auth });
          const account = await dropbox.usersGetCurrentAccount();
          const username = account.result.email;
          storage.setItem('username', username);

          location.href = location.origin + location.pathname;
          return auth;
        }

        return Promise.reject('Dropbox authentication failed, code verifier not found in storage!');
      } catch (e) {
        storage.clear();
        location.href = location.origin + location.pathname;
        throw e;
      }
    }
  }

  storage.clear();
  const authUrl =  auth.getAuthenticationUrl(
    window.location.href, undefined, 'code', 'offline', undefined, undefined, true);
  storage.setItem("verifier", auth.getCodeVerifier());
  window.location.href = authUrl.toString();
  return null as any;
}


export interface DropboxAccessTokenAuthResponse {
  access_token: string,
  uid: string,
  expires_in: number,
  refresh_token: string,
  account_id: string,
}