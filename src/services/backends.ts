import {defaultFileDelta, FileDelta, FileListProgress, FileMetadata, SyncBackend} from "./sync";
import {loadDropboxSession} from "./dropbox";
import {StoredMedia} from "./storage";
import {Maybe} from "../utils/maybe";

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
      resolveFile(path: string): Promise<FileDelta> {
        return Promise.resolve(defaultFileDelta);
      },
      uploadFile(media: StoredMedia): Iterable<Promise<Maybe<"conflict">>> {
        return [];
      },
      downloadFiles(metadata: FileMetadata[]): Iterable<[Promise<[FileMetadata, Blob]>[], Promise<void>]> {
        return [];
      },
      syncFileList(cursor: string): Iterable<Promise<FileListProgress>> {
        return [];
      },
      deleteFile(metadata: FileMetadata): Promise<Maybe<"conflict">> {
        return new Promise(resolve => resolve(null));
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