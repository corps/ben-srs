import {useCallback, useEffect, useMemo} from "react";

export function useChannel(cb: (data: any) => void) {
  const channelKey = useMemo(() => '_' + Math.random().toString(36).substr(2, 9), [])

  useEffect(() => {
    function storageHandler({ key, newValue }: StorageEvent) {
      if (key == channelKey) {
        if (newValue) {
          cb(JSON.parse(newValue))
        }
      }
    }

    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, [cb, channelKey])

  const send = useCallback((recv: string, msg: any) => {
    localStorage.setItem(recv, JSON.stringify(msg));
    localStorage.removeItem(recv);
  }, [])

  return {channelKey, send};
}
