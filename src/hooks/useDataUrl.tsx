import {Maybe, some} from "../utils/maybe";
import {useFileStorage} from "./contexts";
import {useState} from "react";
import {runPromise, useAsync} from "../cancellable";
import {normalizeBlob, readDataUrl} from "../services/storage";

export function useDataUrl(audioFileId: string | null | undefined): Maybe<string> {
  const store = useFileStorage();
  const [dataUrl, setDataUrl] = useState(null as Maybe<string>);

  useAsync(function *() {
    setDataUrl(null);
    if (!audioFileId) return;
    const media = yield* runPromise(store.fetchBlob(audioFileId));
    if (!media) return;
    const blob = normalizeBlob(media[0].blob);
    const dataUrl = yield* runPromise(readDataUrl(blob));
    alert('setting it with ' + dataUrl);
    setDataUrl(some(dataUrl));
  }, [audioFileId, store])

  return dataUrl;
}