import { Dispatch, SetStateAction, useCallback } from 'react';

export function useToggle(
  setState: Dispatch<SetStateAction<boolean>>
): () => void {
  return useCallback(() => {
    setState((b) => !b);
  }, [setState]);
}
