import { makeContextual } from './makeContextual';
import { useCallback, useState } from 'react';
import { Tuple } from '../../shared/tuple';

export const [useTriggerSync, TriggerSyncContext] = makeContextual(
  function useTriggerSync() {
    const [syncId, setSyncId] = useState(0);
    const trigger = useCallback(() => setSyncId((i) => i + 1), []);
    return Tuple.from(trigger, syncId);
  }
);
