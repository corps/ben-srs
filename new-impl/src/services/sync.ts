import {mapSome, Maybe, some, withDefault} from "../utils/maybe";
import {Cancellable, runPromise, runAsync, AsyncGenerator} from "../cancellable";
import 'regenerator-runtime';
import {UnbufferedChannel, Trigger} from "../utils/semaphore";
import {Progress, withProgress, WithProgress} from "../progress";

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
    downloadFiles(metadata: FileMetadata[]): Iterable<Promise<Blob>[]>,
}

const m = new Blob();

export function syncFiles(
    context: Cancellable,
    backend: SyncBackend,
    cursor = "",
) {
    return context.iocRun<null, WithProgress<unknown>>(function* syncFiles() {
        for (let fileList of backend.syncFileList(cursor)) {
            const {delta, cursor: nextCursor} = yield* runPromiseWithSyncProgress(fileList, "Fetch sync batch");
            cursor = nextCursor;

            const deleteReferences: string[] = [];
            const updatedReferences: FileMetadata[] = [];
            delta.forEach(({updated, deleted}) => {
                mapSome(updated, fm => updatedReferences.push(fm));
                mapSome(deleted, path => deleteReferences.push(path));
            })

            const batchWork: Promise<any>[] = [];
            for (let fd of delta) {
                const basePromise = handleDelta(backend, fd);
                batchWork.push(handleDelta(backend, fd));

                const idx = yield* runPromiseWithSyncProgress(Promise.race(batchWork));
            }

            yield Promise.all(batchWork).then(v => withProgress(v, syncProgress("", 1)));
        }

        return null;
    }())
}

export function* runPromiseWithSyncProgress<T>(v: Promise<T>, message: string): AsyncGenerator<T, WithProgress<any>> {
    yield Promise.resolve(withProgress(null, syncProgress(message + ' starting', 1)));
    const [result] = yield v.then(v => [v, syncProgress(message + ' finished', -1)]);
    return result as T;
}

export function syncProgress(message: string, delta: number): Progress {
    return { message, delta, bucket: 'sync' };
}

export function describeDelta(delta: FileDelta): string {
    const updateDetails = withDefault(mapSome(delta.updated, ({path}) => `updated ${path}`), '')
    const deleteDetails = withDefault(mapSome(delta.deleted, (path) => `deleted ${path}`), '')
    return `${updateDetails}${deleteDetails}`
}

export async function handleDelta(backend: SyncBackend, delta: FileDelta) {
    const {updated, deleted} = delta;

    await withDefault(mapSome(updated, async updated => {
        await backend.downloadBinaryFile(updated);
    }), Promise.resolve());

    await withDefault(mapSome(deleted, async deleted => {
        await Promise.resolve();
    }), Promise.resolve());
}