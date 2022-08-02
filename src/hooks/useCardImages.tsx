import {useState} from "react";
import {runPromise, useAsync} from "../cancellable";
import {normalizeBlob, readDataUrl} from "../services/storage";
import {useFileStorage} from "./contexts";

export function useCardImages(imageFileIds: string[] | null | undefined) {
  const store = useFileStorage();
  const [dataUrls, setDataUrls] = useState({} as {[k: string]: string});
  useAsync(function *() {
    const imageIds = imageFileIds || [];
    const dataUrls: Record<string, string> = {};
    for (let imageId of imageIds) {
      const media = yield* runPromise(store.fetchBlob(imageId));
      if (media) {
        const dataUrl = yield* runPromise(readDataUrl(normalizeBlob(media[0].blob)));
        dataUrls[imageId] = dataUrl;
      }
    }

    setDataUrls(dataUrls);
  }, [imageFileIds, store])

  const images = (imageFileIds || [])
    .map(imageId => ({url: dataUrls[imageId], imageId})).filter(i => !!i.url);

  return images;
}