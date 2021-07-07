import {mapSome, Maybe, withDefault} from "../utils/maybe";
import {runPromise} from "../cancellable";
import 'regenerator-runtime';
import {FileStore, getExt, StoredBlob} from "./storage";
import {denormalizedNote, NoteIndexes, parseNote, removeNotesByPath, updateNotes} from "../notes";

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
    syncFileList(cursor: string): Iterable<Promise<FileListProgress>>,
    downloadFiles(metadata: FileMetadata[]): Iterable<[Promise<[FileMetadata, Blob]>[], Promise<void>]>,
    uploadFile(storedBlob: StoredBlob): Iterable<Promise<void>>,
}

export function* syncFiles(
    backend: SyncBackend,
    storage: FileStore,
    onSetPending: (v: number) => void = () => null,
    notesIndex: NoteIndexes,
) {
    let pending = 0;

    function updatePending(d: number) {
        pending += d;
        onSetPending(pending);
    }

    const dirty = yield* runPromise(storage.fetchDirty());
    updatePending(dirty.length);

    for (let d of dirty) {
        for (let work of backend.uploadFile(d)) {
            yield work;
        }

        updatePending(-1);
    }

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
                pendingWork.push(download.then(async ([md, blob]) => {
                    if (withDefault(getExt(md.path), '') === 'txt') {
                        const contents = await blob.text();
                        const note = denormalizedNote(parseNote(contents), md.id, md.path, md.rev);
                        updateNotes(notesIndex, note);
                    }

                    await storage.storeBlob(blob, md, false);
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
            removeNotesByPath(notesIndex, path);
            yield storage.deletePath(path);
            updatePending(-1);
        }

        yield storage.storeCursor(nextCursor);
    }

    updatePending(-1);

    return null;
}