import { useState } from 'react';
import { runPromise } from '../cancellable';
import { useFileStorage } from './useFileStorage';
import { useAsync } from './useWithContext';
import { normalizeBlob, readDataUrl } from '../services/storage';

export function useCardImages(imageFilePaths: string[] | null | undefined) {
  const store = useFileStorage();
  const [dataUrls, setDataUrls] = useState({} as { [k: string]: string });
  const [_, err] = useAsync(
    function* () {
      const imagePaths = imageFilePaths || [];
      const dataUrls: Record<string, string> = {};
      for (let imagePath of imagePaths) {
        const media = yield* runPromise(store.fetchBlobByPath(imagePath));
        if (media) {
          const dataUrl = yield* runPromise(
            readDataUrl(normalizeBlob(media[0].blob))
          );
          dataUrls[imagePath] = dataUrl;
        }
      }

      setDataUrls(dataUrls);
    },
    [imageFilePaths, store]
  );

  const images = (imageFilePaths || [])
    .map((imageFilePath) => ({ url: dataUrls[imageFilePath], imageFilePath }))
    .filter((i) => !!i.url);

  return images;
}
