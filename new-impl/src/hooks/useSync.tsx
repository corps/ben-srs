import {useFileStorage, useNotesIndex, useSession} from "./contexts";
import {useLiveQuery} from "dexie-react-hooks";
import {useAsync} from "../cancellable";
import {syncFiles} from "../services/sync";
import {Dispatch, useEffect, useState} from "react";
import {useNoteLoader} from "./useNoteLoader";

export function useSync(onProgress: Dispatch<number>) {
    const session = useSession();
    const storage = useFileStorage();
    const dirtyRecords = useLiveQuery(async () => storage.fetchDirty(), [], []);
    const [syncCounter, setSyncCounter] = useState(0);
    const notesIndex = useNotesIndex();
    const notesLoaded = useNoteLoader();

    useEffect(() => {
        const lastUpdate = dirtyRecords[dirtyRecords.length - 1]?.updatedAt || 0;
        if (lastUpdate > syncCounter) {
            setSyncCounter(i => Math.max(i, lastUpdate));
        }
    }, [dirtyRecords, syncCounter]);

    return useAsync(function *() {
        onProgress(0);
        onProgress(1);
        yield notesLoaded;
        yield* syncFiles(session.syncBackend(), storage, onProgress, notesIndex)
        onProgress(0);
    }, [syncCounter], () => onProgress(0));
}