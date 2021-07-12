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
    const [syncLastUpdate, setSyncLastUpdate] = useState(0);
    const notesIndex = useNotesIndex();
    const notesLoaded = useNoteLoader();

    useEffect(() => {
        console.log('sync triggered...');
        const lastUpdate = dirtyRecords[dirtyRecords.length - 1]?.updatedAt || 0;
        if (lastUpdate > syncLastUpdate) {
            setSyncLastUpdate(i => Math.max(i, lastUpdate));
        }
    }, [dirtyRecords, syncLastUpdate]);

    return useAsync(function *() {
        onProgress(0);
        onProgress(1);
        yield notesLoaded;
        yield* syncFiles(session.syncBackend(), storage, onProgress, notesIndex)
    }, [syncLastUpdate, onProgress], () => onProgress(0));
}