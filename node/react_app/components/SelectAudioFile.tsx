import { useLiveQuery } from 'dexie-react-hooks';
import React, { useCallback, useMemo } from 'react';
import { useFileStorage } from '../hooks/useFileStorage';
import { Maybe, some } from '../../shared/maybe';
import { SelectSingle } from './SelectSingle';
import { audioContentTypes } from '../../shared/files';
import { StoredMetadata } from '../services/storage';

interface Props {
  value: string; // audio file id
  options: StoredMetadata[];
  onChange?: (fileId: Maybe<string>) => void;
}

export function SelectAudioFile(props: Props) {
  const store = useFileStorage();
  const allAudioMetadatas = useLiveQuery(
    async () => store.fetchMetadataByExts(Object.keys(audioContentTypes)),
    [],
    []
  );
  const { value, options, onChange } = props;

  const setAudioPath = useCallback(
    (selected: string) => {
      const md = options.find(({ path }) => path === selected);
      if (!onChange) return;
      if (!md) return onChange(null);
      onChange(some(md.id));
    },
    [options, onChange]
  );

  const curSelectedAudioPath = useMemo(
    () => allAudioMetadatas.find(({ id }) => id === value)?.path || '',
    [allAudioMetadatas, value]
  );
  const audioPaths = useMemo(
    () => ['<unset>', ...options.map(({ path }) => path)],
    [options]
  );

  return (
    <SelectSingle
      placeholder={curSelectedAudioPath || 'オーディオ'}
      onChange={setAudioPath}
      value={curSelectedAudioPath}
      values={audioPaths}
    />
  );
}
