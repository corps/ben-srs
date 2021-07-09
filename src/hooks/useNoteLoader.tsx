import {useEffect, useState} from "react";
import {Trigger} from "../utils/semaphore";
import {useFileStorage, useNotesIndex} from "./contexts";
import {NoteIndexes} from "../notes";

export function useNoteLoader() {
    const index = useNotesIndex();
    const storage = useFileStorage();
    const [loadedTrigger] = useState(() => new Trigger<void>());
    // @ts-ignore
    const [worker] = useState(() => new Worker(new URL('../services/index-worker.ts', import.meta.url)));


    useEffect(() => {
        storage.fetchBlobsByExt('txt').then(noteBlobs => {
            worker.postMessage({
                noteBlobs
            });
        }, loadedTrigger.reject)

        worker.onmessage = ({ data: { indexes: indexedData } }: {data: {indexes: NoteIndexes}}) => {
            Object.assign(index, indexedData);
            loadedTrigger.resolve();
        };
    }, [index, loadedTrigger, storage, worker])

    return loadedTrigger.promise;
}