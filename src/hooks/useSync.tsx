import {useFileStorage, useNotesIndex, useSession} from "./contexts";
import {useAsync} from "../cancellable";
import {syncFiles} from "../services/sync";
import {Dispatch, useCallback, useEffect, useState} from "react";
import {Maybe} from "../utils/maybe";
import {useNoteLoader} from "./useNoteLoader";

export function useTriggerSync(): [Dispatch<void>, number] {
    const [syncLastUpdate, setSyncLastUpdate] = useState(0);

    const triggerSync = useCallback(() => {
        setSyncLastUpdate(i => i + 1)
    }, []);

    return [triggerSync, syncLastUpdate];
}

export function useSync(onProgress: Dispatch<number>): [Maybe<any>, Maybe<any>] {
    const session = useSession();
    const storage = useFileStorage();
    const notesIndex = useNotesIndex();
    const [triggerSync, syncLastUpdate] = useTriggerSync();

    const notesLoaded = useNoteLoader();

    // Force a sync every 60 seconds.
    useEffect(() => {
      const h = setInterval(() => triggerSync(), 1000 * 60);
      return () => clearInterval(h);
    }, [triggerSync]);

    return useAsync(function *() {
        onProgress(0);
        onProgress(1);
        yield notesLoaded;
        yield* syncFiles(session.syncBackend(), storage, onProgress, notesIndex)
    }, [syncLastUpdate, onProgress, session, storage, onProgress, notesIndex, notesLoaded], () => onProgress(0));
}