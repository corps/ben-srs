import {
  useFileStorage,
  useNotesIndex,
  useTriggerSync
} from './contexts';
import { syncFiles } from '../services/sync';
import { Dispatch, useEffect} from 'react';
import { Maybe } from '../utils/maybe';
import { useNoteLoader } from './useNoteLoader';
import { useAsync } from './useWithContext';
import {DropboxSyncBackend} from "../services/dropbox";
import {useSession} from "../session";
import {Dropbox} from "dropbox";

export function useSync(
  onProgress: Dispatch<number>
): [Maybe<any>, Maybe<any>] {
  const [session, _] = useSession();
  const storage = useFileStorage();
  const notesIndex = useNotesIndex();
  const [triggerSync, syncLastUpdate] = useTriggerSync();

  const notesLoaded = useNoteLoader();

  // Force a sync every 60 seconds.
  useEffect(() => {
    const h = setInterval(() => triggerSync(), 1000 * 60);
    return () => clearInterval(h);
  }, [triggerSync]);

  return useAsync(
    function* () {
      onProgress(0);
      onProgress(1);
      try {
        yield notesLoaded;
        yield* syncFiles(new DropboxSyncBackend(new Dropbox({auth: session.auth })),
          storage,
          onProgress,
          notesIndex
        );
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [
      syncLastUpdate,
      onProgress,
      session,
      storage,
      onProgress,
      notesIndex,
      notesLoaded
    ],
    () => onProgress(0)
  );
}
