import {useEffect, useState} from "react";
import {Trigger} from "../utils/semaphore";
import {useFileStorage, useNotesIndex} from "./contexts";
import {NoteIndexes} from "../notes";

export function useNoteLoader() {
    const index = useNotesIndex();
    const storage = useFileStorage();
    const [loadedTrigger] = useState(() => new Trigger<void>());
    const [fired, setFired] = useState(false);
    // @ts-ignore
    const [worker] = useState(() => new Worker(new URL('../services/index-worker.ts', import.meta.url)));


    useEffect(() => {
        if (fired) return;
        setFired(true);
        worker.postMessage({});
        worker.onmessage = ({ data: { indexes: indexedData } }: {data: {indexes: NoteIndexes}}) => {
            Object.assign(index, indexedData);
            loadedTrigger.resolve();
        };
    }, [fired, index, loadedTrigger, worker])

    return loadedTrigger.promise;
}