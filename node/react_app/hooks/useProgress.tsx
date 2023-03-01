import { Dispatch, useCallback, useState } from 'react';

export type ProgressState = { pending: number; completed: number };

export function useProgress(): ProgressState & {
  onProgress: Dispatch<number>;
} {
  const [[pending, completed], setProgress] = useState([0, 0] as [
    number,
    number
  ]);
  const onProgress = useCallback(
    (count: number) => {
      setProgress(([p, c]) => {
        const result: [number, number] = [count, c];
        if (count === 0) return [0, 0];
        else if (count > p) return [count, c];
        else result[1] += p - count;

        return result;
      });
    },
    [setProgress]
  );

  return { pending, completed, onProgress };
}
