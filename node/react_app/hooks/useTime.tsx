import { useEffect, useState } from 'react';

export function useTime(interval = 1000 * 15): number {
  const [time, setTime] = useState(() => Date.now());

  useEffect(() => {
    const handle = setInterval(() => setTime(Date.now()), interval);
    return () => {
      clearInterval(handle);
    };
  }, [interval]);

  return time;
}
