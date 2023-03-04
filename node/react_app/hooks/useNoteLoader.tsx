import { useEffect, useState } from 'react';
import { Trigger } from '../../shared/semaphore';
import { useNotesIndex } from './useNotesIndex';
import { makeContextual } from './makeContextual';
import { NoteIndexes } from '../services/indexes';

export const [useNoteLoader, NoteLoaderContext] = makeContextual(
  function useNoteLoader() {
    const [index, setIndex] = useNotesIndex();
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
        setIndex(Object.assign({}, index, indexedData));
        loadedTrigger.resolve();
      };
    }, [fired, index, loadedTrigger, setIndex, worker]);

    return loadedTrigger.promise;
  }
);
