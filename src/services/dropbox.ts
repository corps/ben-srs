import 'regenerator-runtime';
import {Dropbox, DropboxAuth, files} from "dropbox";
import {defaultUser, Session, User} from "./backends";
import {defaultFileDelta, FileDelta, FileListProgress, FileMetadata, SyncBackend} from "./sync";
import {Either, left, Maybe, right, some} from "../utils/maybe";
import {withRetries} from "../utils/retryable";
import {DynamicRateLimitQueue, GatingException} from "../utils/rate-limiting";
import {normalizeBlob, StoredMedia} from "./storage";
import {BensrsClient} from "./bensrs";

export class DropboxSession implements Session {
  constructor(private auth: DropboxAuth,
    public user: User,
    private storage: Storage,
    public refresh: () => Promise<Session>,
  ) {
  }

  logout(): Promise<void> {
    this.storage.clear();
    return Promise.resolve();
  }

  syncBackend(): SyncBackend {
    return new DropboxSyncBackend(new Dropbox({auth: this.auth}));
  }
}

export class DropboxSyncBackend implements SyncBackend {
  requestQ = new DynamicRateLimitQueue();

  constructor(public db: Dropbox) {
  }

  resolveFile(path: string): Promise<{ deleted: Maybe<string>; updated: Maybe<FileMetadata>; }> {
    return this.handleRetry(async () => this.handleRateLimit(async () => {
      try {
        const md = await this.db.filesGetMetadata({path, include_deleted: true});
        if (md.result[".tag"] == "file") {
          return { deleted: null, updated: some(mapDropboxMetadata(md.result as files.FileMetadataReference)) };
        } else {
          return { deleted: some(path), updated: null };
        }
      } catch (error: any) {
        if ('status' in error && error.status === 404) {
          return { deleted: some(path), updated: null };
        }

        throw error;
      }
    }));
  }

  async deleteFile(metadata: FileMetadata): Promise<Maybe<"conflict">> {
    if (!metadata.rev) return null;
    return this.db.filesDeleteV2({path: metadata.path, parent_rev: metadata.rev}).then<Maybe<"conflict">>(v => null as any, error => {
      if ('status' in error && error.status === 409) {
        return some("conflict" as "conflict") as any;
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
    } catch (e: any) {
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

  uploadFile(media: StoredMedia): Iterable<Promise<Either<FileMetadata, "conflict">>> {
    const {db} = this;

    function* uploadFile(): Generator<Promise<Either<FileMetadata, "conflict">>> {
      yield db.filesUpload({
        contents: normalizeBlob(media.blob),
        path: media.path,
        mode: media.rev ? {'.tag': "update", update: media.rev} : {'.tag': 'add'},
      }).then<Either<FileMetadata, "conflict">>(res => right<FileMetadata, "conflict">(mapDropboxMetadata(res.result)), error => {
        if ('status' in error && error.status === 409) {
          return left<"conflict", FileMetadata>("conflict" as "conflict") as any;
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
          updated: some(mapDropboxMetadata(r as files.FileMetadataReference)),
        })
      }
      if (r[".tag"] === "deleted" && r.path_lower) {
        acc.push({
          ...defaultFileDelta,
          deleted: some(r.path_lower),
        })
      }

      return acc;
    }, [] as FileDelta[]),
    cursor: response.cursor,
  };
}

export function loadDropboxSession() {
  return async function loadDropboxSession(storage: Storage, force = false): Promise<Session> {
    const auth = await getDropboxAuthOrLogin(storage, force);

    let user = {...defaultUser};
    const existingUserName = storage.getItem('username');
    if (existingUserName) {
      user = {...user, username: existingUserName };
    } else {
      return loadDropboxSession(storage, true);
    }

    return new DropboxSession(auth, user, storage, () => loadDropboxSession(storage, true));
  }
}

export async function getDropboxAuthOrLogin(storage: Storage, force = false): Promise<DropboxAuth> {
  const existingToken = storage.get('token');
  const existingAppKey = storage.get('key');

  const bensrs = new BensrsClient();

  if (force) {
    window.location.href = bensrs.startUrl();
    return new DropboxAuth();
  }

  let match;
  if ((match = window.location.search.match(/\?at=([^&]+)/))) {
    const authorization_code = match[1];
    await bensrs.callJson(BensrsClient.LoginEndpoint, {authorization_code});
    window.location.href = bensrs.host;
    return new DropboxAuth();
  }

  try {
    const {success, ...auth} = await bensrs.callJson(BensrsClient.LoginEndpoint, {});

    if (success && 'access_token' in auth) {
      storage.setItem('username', auth.email || "");
      storage.setItem('token', auth.access_token || "");
      storage.setItem('key', auth.app_key || "")
      return new DropboxAuth({
        accessToken: auth.access_token,
        clientId: auth.app_key,
      });
    }
  } catch (e) {
    return new DropboxAuth({accessToken: existingToken, clientId: existingAppKey});
  }

  window.open(bensrs.startUrl(), "_blank")
  window.location.href = bensrs.authorizeUrl();
  return new DropboxAuth();
}