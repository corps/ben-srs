import React, {ChangeEvent, Dispatch, useCallback, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {
  denormalizedNote,
  findNoteTree,
  newNormalizedNote,
  NormalizedNote,
  normalizedNote, NoteTree,
  stringifyNote,
  updateNotes
} from "../notes";
import {mapSome, Maybe, withDefault} from "../utils/maybe";

interface Props {
  onReturn?: () => void,
  onApply: (tree: Maybe<NoteTree>, updated: NormalizedNote) => Promise<void>,
  noteId: string,
}

const allLanguages = ['Japanese', 'Cantonese', 'English', 'Test'];

export function EditNote(props: Props) {
  const notesIndex = useNotesIndex();
  const setRoute = useRoute();
  const {onReturn = () => setRoute(() => null), noteId} = props;
  const [normalized, setNormalized] = useState(() => {
    return withDefault(mapSome(findNoteTree(notesIndex, noteId), normalizedNote), {...newNormalizedNote});
  });

  const onApply = useCallback(async () => {
    const baseTree = findNoteTree(notesIndex, noteId);
    await props.onApply(baseTree, normalized);
  }, [notesIndex, noteId, props, normalized])

  const setNoteContent = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNormalized(note => ({
      ...note,
      attributes: {
        ...note.attributes,
        content: (e.target as HTMLTextAreaElement).value
      }
    }))
  }, [])

  const setNoteLanguage = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setNormalized(note => ({
      ...note,
      attributes: {
        ...note.attributes,
        language: (e.target as HTMLSelectElement).value
      }
    }))
  }, [])

  return <div>
    <div className="tc pt5-ns fw5 mb2">
      <div className="f5">
        <div className="ml2 w4 dib">
          <SelectSingle
            placeholder="言語を選択"
            onChange={setNoteLanguage}
            value={normalized.attributes.language}
            values={allLanguages}
          />
        </div>
      </div>
    </div>

    <div className="mw6 center">
      <div className="pa3">
        <textarea
          className="w-100 input-reset"
          rows={6}
          onChange={setNoteContent}
          value={normalized.attributes.content}
        />
      </div>

      <div className="tr">
        <button
          className="mh1 pa2 br2"
          onClick={onApply}
          disabled={
            !normalized.attributes.content ||
            !normalized.attributes.language
          }>
          適用
        </button>

        <button className="mh1 pa2 br2" onClick={onReturn}>
          キャンセル
        </button>
      </div>
    </div>
  </div>
}