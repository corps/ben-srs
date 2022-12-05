import {Either, getLeft, getRight, mapSome, Maybe, withDefault} from "../utils/maybe";
import {runPromise} from "../cancellable";
import 'regenerator-runtime';
import {FileStore, getExt, normalizeBlob, readText, StoredMedia} from "./storage";
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
    resolveFile(path: string): Promise<FileDelta>,
    uploadFile(media: StoredMedia): Iterable<Promise<Either<FileMetadata, "conflict">>>,
    deleteFile(metadata: FileMetadata): Promise<Maybe<"conflict">>,
}

export function* syncFiles(
    backend: SyncBackend,
    storage: FileStore,
    onSetPending: (v: number) => void = () => null,
    notesIndex: NoteIndexes,
    ignoreBin = false
) {
    let pending = 0;

    function updatePending(d: number) {
        pending += d;
        onSetPending(pending);
    }

    updatePending(1);

    const dirty = yield* runPromise(storage.fetchDirty());

    updatePending(dirty.length);

    function* handleConflict(work: Promise<Maybe<"conflict">>, d: any) {
        const uploadConflict = yield* runPromise(work);
        if (uploadConflict && uploadConflict[0] === "conflict") {
            yield storage.storeBlob(new Blob([]), d, 2);
            return true;
        }

        return false;
    }

    for (let d of dirty) {
        if (d.deleted) {
            const conflicted = yield* handleConflict(backend.deleteFile(d), d);
            if (!conflicted) {
                yield storage.deleteId(d.id);
                removeNotesByPath(notesIndex, d.path);
            }
        } else {
            for (let work of backend.uploadFile(d)) {
                const result: Either<FileMetadata, "conflict"> = yield* runPromise(work);
                const conflict: Maybe<"conflict"> = getLeft<FileMetadata, "conflict">(result);
                const updated = getRight<FileMetadata, "conflict">(result);
                
                yield* runPromise(withDefault(mapSome(updated, updated => {
                    const updatedSf: StoredMedia = {...d, ...updated};
                    return storage.storeBlob(normalizeBlob(updatedSf.blob), updatedSf, false);
                }), Promise.resolve()));

                yield* handleConflict(Promise.resolve<Maybe<"conflict">>(conflict as any), d);
            }

            if (!d.rev) {
              // Remove the local copy, force sync to hand back a copy with updated id.
              yield storage.deleteId(d.id);
              removeNotesByPath(notesIndex, d.path);
            }
        }

        updatePending(-1);
    }

    function* handleDelta(delta: FileDelta[]) {
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
                        const contents = await readText(blob);
                        const note = denormalizedNote(parseNote(contents), md.id, md.path, md.rev);
                        updateNotes(notesIndex, note);
                    }

                    try {
                        await storage.storeBlob(blob, md, false);
                    } catch (e) {
                        console.error('problem storing', md, blob, blob.constructor === Blob);
                        throw e;
                    }
                }));
            }

            if (pendingWork.length > 0) {
                const idx = yield* runPromise(Promise.race(pendingWork.map((work, idx) => work.then(v => idx))))
                updatePending(-1);

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
    }

    updatePending(1);

    const conflicted = yield* runPromise(storage.fetchConflicted());
    const conflictedDeltas: FileDelta[] = [];
    for (let conflict of conflicted) {
        updatePending(1);
        const nextDelta = yield* runPromise(backend.resolveFile(conflict.path));
        updatePending(-1);
        conflictedDeltas.push(nextDelta);
    }

    yield *handleDelta(conflictedDeltas);
    updatePending(-1);

    let cursor = yield* runPromise(storage.getCursor());
    for (let fileList of backend.syncFileList(cursor)) {
        updatePending(1);
        const {delta, cursor: nextCursor} = yield* runPromise(fileList);
        updatePending(-1);
        yield* handleDelta(delta);
        yield storage.storeCursor(nextCursor);

        pending = 0;
        updatePending(0);
        updatePending(1);
    }

    updatePending(-1);
    return null;
}
