import {useFileStorage, useNotesIndex, useSession} from "./contexts";
import {useLiveQuery} from "dexie-react-hooks";
import {useAsync} from "../cancellable";
import {syncFiles} from "../services/sync";
import {Dispatch, useEffect, useMemo, useState} from "react";
import {loadNotes} from "../services/storage";
import {Maybe} from "../utils/maybe";

export function useSync(onProgress: Dispatch<number>): [Maybe<any>, Maybe<any>] {
    const session = useSession();
    const storage = useFileStorage();
    const indexes = useNotesIndex();
    const dirtyRecords = useLiveQuery(async () => storage.fetchDirty(), [], []);
    const [syncLastUpdate, setSyncLastUpdate] = useState(0);
    const notesIndex = useNotesIndex();

    const notesLoaded: Promise<any> = useMemo(async function () {
        await loadNotes(storage, indexes);
    }, [indexes, storage]);

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