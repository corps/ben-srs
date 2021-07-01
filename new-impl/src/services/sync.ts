import {mapSome, Maybe, some, withDefault} from "../utils/maybe";
import {Cancellable} from "../cancellable";

export const defaultFileMetadata = {
  path: "/",
  id: "",
  rev: "",
  size: 0
}

export type FileMetadata = typeof defaultFileMetadata;

export const defaultFileDelta = {
  deleted: null as Maybe<string>,
  updated: null as Maybe<FileMetadata>,
}

export type FileDelta = typeof defaultFileDelta;

export const defaultFileListProgress = {
  delta: [] as FileDelta[],
  cursor: ""
}

export type FileListProgress = typeof defaultFileListProgress;

export interface SyncBackend {
  syncFileList(cursor: string): Iterable<Promise<FileListProgress>>
  downloadTextFile(metadata: FileMetadata): Promise<string>,
  downloadBinaryFile(metadata: FileMetadata): Promise<Blob>,
}

export async function syncFiles(
  context: Cancellable,
  backend: SyncBackend,
  cursor = "",
) {
  for (let fileList of backend.syncFileList(cursor)) {
    const {result, cancelled} = await context.race(fileList);
    if (cancelled) return;

    const { delta, cursor: nextCursor } = withDefault(result, defaultFileListProgress);
    cursor = nextCursor;

    await Promise.all(delta.map(({ updated }) => {
      withDefault(mapSome(updated, (updated) => backend.downloadBinaryFile(updated).then(v => some(v))), Promise.resolve(null))
    })).then(downloaded => {
      console.log(downloaded);
    });
  }
}