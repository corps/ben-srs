import { useCallback, useEffect } from 'react';

function getAsString(item: DataTransferItem) {
  return new Promise<string>((resolve, reject) => item.getAsString(resolve));
}

function loadImage(url: string) {
  return new Promise<File>((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      try {
        let fileName;
        try {
          const cd = xhr.getResponseHeader('content-disposition') || '';
          fileName = cd.split('filename=')[1].split(';')[0];
        } catch (e) {
          const parts = url.split('/');
          fileName = parts[parts.length - 1];
        }
        resolve(new File([xhr.response], fileName));
      } catch (e) {
        reject(e);
      }
    };
    xhr.onerror = (e) => reject(new Error('Failed to load image data'));
    xhr.send();
  });
}

export function useOnPaste(cb: (files: File[]) => void, deps: any[]) {
  const handler: EventListener = useCallback(async (e: Event) => {
    const cc = e as ClipboardEvent;
    const files: File[] = [];
    if (cc.clipboardData) {
      const items = cc.clipboardData.items;
      for (let i = 0; i < items.length; ++i) {
        const item = cc.clipboardData.items[i];
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        } else if (item.type === 'text/html') {
          const html = await getAsString(item);
          const d = document.createElement('DIV');
          d.innerHTML = html;
          const q = [d];
          while (q.length) {
            const next = q.pop();
            if (!next) break;
            if (next.nodeName === 'IMG' || next.nodeName === 'AUDIO') {
              try {
                const image = await loadImage(next.getAttribute('src') || '');
                files.push(image);
              } catch (e) {
                console.error(e);
              }
            }

            for (let i = 0; i < next.children.length; ++i) {
              q.push(next.children[i] as HTMLElement);
            }
          }
        }
      }

      cb(files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  });
}
