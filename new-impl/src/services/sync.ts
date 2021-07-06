import {mapSome, Maybe} from "../utils/maybe";
import {Cancellable, runPromise} from "../cancellable";
import 'regenerator-runtime';
import {FileStore} from "./storage";
import {NotesIndex} from "../notes";

export const defaultFileMetadata = {
    path: "/",
    id: "",
    rev: "",
    size: 0
}

export type FileMetadata = typeof defaultFileMetadata & { updatedAt?: number };

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

    downloadFiles(metadata: FileMetadata[]): Iterable<[Promise<[FileMetadata, Blob]>[], Promise<void>]>,
}

export function* syncFiles(
    backend: SyncBackend,
    storage: FileStore,
    onSetPending: (v: number) => void = () => null,
    notesIndex: NotesIndex,
) {
    let pending = 0;

    function updatePending(d: number) {
        pending += d;
        onSetPending(pending);
    }

    updatePending(1);
    let cursor = yield* runPromise(storage.getCursor());

    for (let fileList of backend.syncFileList(cursor)) {
        updatePending(1);
        const {delta, cursor: nextCursor} = yield* runPromise(fileList);
        updatePending(-1);

        const deletePaths: string[] = [];
        const updatedReferences: FileMetadata[] = [];
        delta.forEach(({updated, deleted}) => {
            mapSome(updated, fm => updatedReferences.push(fm));
            mapSome(deleted, path => deletePaths.push(path));
        })

        updatePending(updatedReferences.length);

        const pendingWork: Promise<any>[] = [];
        for (let [batch, limiter] of backend.downloadFiles(updatedReferences)) {
            for (let download of batch) {
                pendingWork.push(download.then(([md, blob]) =>
                    storage.storeBlob(blob, md, false)).then(() => {
                    updatePending(-1);
                }));
            }

            if (pendingWork.length > 0) {
                const idx = yield* runPromise(
                    Promise.race(pendingWork.map((work, idx) => work.then(v => idx))))

                pendingWork.splice(idx, 1);
            }

            yield limiter;
        }

        yield Promise.all(pendingWork);

        updatePending(deletePaths.length);
        for (let path of deletePaths) {
            const deletedIds = notesIndex.notesIndex.indexes.byPath.sliceMatching(
                path.split('/'), [...path.split('/'), Infinity]).map(({id}) => id)
            yield storage.deletePath(path);
            updatePending(-1);
        }

        yield storage.storeCursor(nextCursor);
    }

    updatePending(-1);

    return null;
}