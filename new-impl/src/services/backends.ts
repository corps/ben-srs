import {defaultFileListProgress, FileListProgress, FileMetadata, SyncBackend} from "./sync";
import {loadDropboxSession} from "./dropbox";

export const defaultUser = {
  username: "",
  needsRefreshAt: new Date(Date.now() + 1000 * 3600),
};

export type User = typeof defaultUser;

export const defaultSession: Session = {
  user: defaultUser,
  logout(): Promise<void> {
    return Promise.resolve();
  },
  refresh(): Promise<Session> {
    return Promise.resolve(defaultSession);
  },
  syncBackend(): SyncBackend {
    return {
      downloadBinaryFile(metadata: FileMetadata): Promise<Blob> {
        return Promise.resolve(new Blob());
      }, downloadTextFile(metadata: FileMetadata): Promise<string> {
        return Promise.resolve("");
      }, syncFileList (cursor: string): Iterable<Promise<FileListProgress>> {
        function* iter() {
          yield Promise.resolve(defaultFileListProgress);
        }

        return iter();
      }
    }
  }
}

export interface Session {
  user: User,
  logout(): Promise<void>,
  refresh(): Promise<Session>,
  syncBackend(): SyncBackend,
}

export interface Backend {
  loadSession(storage: Storage): Promise<Session>,
}

export const backends = {
  dropbox: {
    loadSession: loadDropboxSession("tlu6ta8q9mu0w01"),
  },
}

export type BackendType = keyof typeof backends;
export const allBackends = Object.keys(backends);