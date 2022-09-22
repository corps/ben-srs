import { useCallback, useEffect, useRef, useState } from "react";
import { mapSome, Maybe, some } from "../utils/maybe";

export function useCapture() {
    // const [canvas, setCanvas] = useState(() => document.createElement("canvas"));
    const [captureStream, setCaptureStream] = useState<Maybe<MediaStream>>(null as Maybe<MediaStream>);

    useEffect(() => {
        return () => { 
            mapSome(captureStream, (stream: MediaStream) => {
                stream.getTracks().forEach(t => t.stop());
            }) 
        };
    }, [captureStream]);

    const startVideoCaptureStream = useCallback(async () => {
        const stream = await navigator.mediaDevices.getDisplayMedia({ audio: false, video: true });
        setCaptureStream(some(stream));
    }, []);

    const stopVideoCaptureStream = useCallback(() => setCaptureStream(null), []);

    const captureScreenshot = useCallback((video: HTMLVideoElement) => {
          const canvas = document.createElement("canvas");
          canvas.width = video.width;
          canvas.height  = video.height;
          const context = canvas.getContext("2d");
          if (context) context.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL();
          // return new Promise<Blob>((resolve, reject) => {
          //     canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('no blob')), 'image/png');
          // }).finally(() => canvas.remove());
    }, []);

    return {
        startVideoCaptureStream,
        captureStream,
        stopVideoCaptureStream,
        captureScreenshot,
    };
}
