import React, {
  Dispatch,
  PropsWithChildren,
  useCallback,
  useMemo
} from 'react';
import { Indexer } from '../../shared/indexable';
import { SelectSingle } from './SelectSingle';
import { useNotesIndex } from '../hooks/useNotesIndex';
import { useStudyContext } from '../hooks/useStudyContext';

interface Props {
  value: string[];
  language: string;
  onChange: Dispatch<string[]>;
  singular?: boolean;
}

export function TagsSelector({
  value,
  language,
  onChange,
  singular,
  children
}: PropsWithChildren<Props>) {
  const { allTags } = useStudyContext();
  const tags = useMemo(() => {
    if (singular) return allTags;
    return ['', '/new/', ...allTags.filter((tag) => tag !== language)];
  }, [allTags, language, singular]);

  const updateCurTags = useCallback(
    (newValue: string, i: number) => {
      if (newValue == '/new/') {
        const newTag = prompt('Enter new tag:');
        if (newTag) {
          onChange([...value.slice(0, i), newTag, ...value.slice(i + 1)]);
        }
      } else if (newValue) {
        onChange([...value.slice(0, i), newValue, ...value.slice(i + 1)]);
      } else {
        onChange([...value.slice(0, i), ...value.slice(i + 1)]);
      }
    },
    [onChange, value]
  );

  return (
    <div className="f5">
      タグ:
      {value.map((tag, i) => (
        <div key={tag} className="ml2 w4 dib">
          <SelectSingle
            onChange={(tag) => updateCurTags(tag, i)}
            value={tag}
            values={tags}
          />
        </div>
      ))}
      {!singular ? (
        <div className="ml2 w4 dib">
          <SelectSingle
            onChange={(tag) => updateCurTags(tag, tags.length)}
            value={''}
            values={tags}
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
