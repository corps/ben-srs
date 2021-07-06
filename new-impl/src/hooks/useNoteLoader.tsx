import {useEffect, useState} from "react";
import {Trigger} from "../utils/semaphore";
import {NotesIndex} from "../notes";
import {useFileStorage, useNotesIndex} from "./contexts";
import {recursivelyInstallData} from "../utils/indexable";

export function useNoteLoader() {
    const index = useNotesIndex();
    const storage = useFileStorage();
    const [loadedTrigger] = useState(() => new Trigger<void>());
    const [worker] = useState(() => new Worker(new URL('../services/index-worker.ts' /*, import.meta.url*/)));

    useEffect(() => {
        storage.fetchBlobsByExt('txt').then(noteBlobs => {
            worker.postMessage({
                noteBlobs
            });
        }, loadedTrigger.reject)

        worker.onmessage = ({ data: { index: indexedData } }: {data: {index: NotesIndex}}) => {
            console.log('recursively installing', indexedData);
            recursivelyInstallData(index, indexedData);
            loadedTrigger.resolve();
        };
    }, [])

    return loadedTrigger.promise;
}