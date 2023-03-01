import { useEffect, useState } from 'react';
import { Trigger } from '../../shared/semaphore';
import { NoteIndexes } from '../notes';
import { useNotesIndex } from './useNotesIndex';
import { makeContextual } from './makeContextual';

export const [useNoteLoader, NoteLoaderContext] = makeContextual(
  function useNoteLoader() {
    const [index] = useNotesIndex();
    const [loadedTrigger] = useState(() => new Trigger<void>());
    const [fired, setFired] = useState(false);
    // @ts-ignore
    const [worker] = useState(
      () => new Worker(new URL('../services/index-worker.ts', import.meta.url))
    );

    useEffect(() => {
      if (fired) return;
      setFired(true);
      worker.postMessage({});
      worker.onmessage = ({
        data: { indexes: indexedData }
      }: {
        data: { indexes: NoteIndexes };
      }) => {
        Object.assign(index, indexedData);
        loadedTrigger.resolve();
      };
    }, [fired, index, loadedTrigger, worker]);

    return loadedTrigger.promise;
  }
);
