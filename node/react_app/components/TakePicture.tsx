import React, { PropsWithChildren, useCallback, useRef } from 'react';
import { readAsArrayBuffer } from '../services/storage';

interface Props {
  className?: string;
  onPicture?: (f: File) => void;
}

export function TakePicture({ className, onPicture }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = useCallback(() => {
    const { current } = inputRef;
    if (!current) return;

    const { files } = current;
    if (!files) return;

    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      if (onPicture) onPicture(file);
    }
  }, [onPicture]);

  return (
    <input
      type="file"
      capture="environment"
      accept="image/*"
      className={className}
      ref={inputRef}
      onChange={onChange}
    />
  );
}
