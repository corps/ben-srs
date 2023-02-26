import { Maybe, some } from '../../shared/maybe';
import { useState } from 'react';
import { runPromise } from '../cancellable';
import { useFileStorage } from './useFileStorage';
import { useAsync } from './useWithContext';
import { normalizeBlob, readDataUrl } from '../services/storage';

export function useDataUrl(
  audioFileId: string | null | undefined
): Maybe<string> {
  const store = useFileStorage();
  const [dataUrl, setDataUrl] = useState(null as Maybe<string>);

  useAsync(
    function* () {
      setDataUrl(null);
      if (!audioFileId) return;
      const media = yield* runPromise(store.fetchBlob(audioFileId));
      if (!media) return;
      const blob = normalizeBlob(media[0].blob);
      const dataUrl = yield* runPromise(readDataUrl(blob));
      setDataUrl(some(dataUrl));
    },
    [audioFileId, store]
  );

  return dataUrl;
}
