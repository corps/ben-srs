import { syncFiles } from '../services/sync';
import { useCallback, useEffect, useState } from 'react';
import { useNoteLoader } from './useNoteLoader';
import { useAsync } from './useWithContext';
import { DropboxSyncBackend } from '../services/dropbox';
import { useSession } from './useSession';
import { Dropbox } from 'dropbox';
import { useFileStorage } from './useFileStorage';
import { useNotesIndex } from './useNotesIndex';
import { useProgress } from './useProgress';
import { makeContextual } from './makeContextual';

export const [useSync, SyncContext] = makeContextual(function useSync() {
  const [session, _] = useSession();
  const storage = useFileStorage();
  const { pending, completed, onProgress: _onProgress } = useProgress();
  const [syncId, setSyncId] = useState(0);
  const triggerSync = useCallback(() => setSyncId((i) => i + 1), []);
  const [notesIndex, setNotesIndex] = useNotesIndex();
  const onProgress = (p: number) => {
    _onProgress(p);
    setNotesIndex((i) => ({ ...i }));
  };

  const notesLoaded = useNoteLoader();

  // Force a sync every 60 seconds.
  useEffect(() => {
    const h = setInterval(() => triggerSync(), 1000 * 60);
    return () => clearInterval(h);
  }, [triggerSync]);

  // Storage should clear and sync should restart if the store doesn't match the session we log into.
  const [result, error] = useAsync(
    function* () {
      onProgress(0);
      onProgress(1);
      try {
        yield notesLoaded;
        yield* syncFiles(
          new DropboxSyncBackend(new Dropbox({ auth: session.auth })),
          storage,
          onProgress,
          notesIndex
        );
      } catch (e) {
        console.error(e);
        throw e;
      }

      return true;
    },
    [syncId],
    () => onProgress(0)
  );

  return {
    pending,
    completed,
    triggerSync,
    error,
    isSyncing: !error && !result
  };
});
