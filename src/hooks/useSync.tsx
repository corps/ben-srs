import {useFileStorage, useNotesIndex, useSession, useTriggerSync} from "./contexts";
import {syncFiles} from "../services/sync";
import {Dispatch, useCallback, useEffect, useState} from "react";
import {Maybe} from "../utils/maybe";
import {useNoteLoader} from "./useNoteLoader";
import {useAsync} from "./useWithContext";

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