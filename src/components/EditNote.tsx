import React, {ChangeEvent, useCallback, useMemo, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {
  findNoteTree, newNormalizedNote, NormalizedNote, normalizedNote, NoteTree,
} from "../notes";
import {mapSome, Maybe, withDefault} from "../utils/maybe";
import {useLiveQuery} from "dexie-react-hooks";
import {audioContentTypes} from "../services/storage";
import {Indexer} from "../utils/indexable";
import {playAudio} from "../services/speechAndAudio";

interface Props {
  onReturn?: () => void,
  onApply: (tree: Maybe<NoteTree>, updated: NormalizedNote) => Promise<void>,
  noteId: string,
}

const allLanguages = ['Japanese', 'Cantonese', 'English', 'Test'];

export function EditNote(props: Props) {
  const notesIndex = useNotesIndex();
  const setRoute = useRoute();
  const store = useFileStorage();
  const {onReturn = () => setRoute(() => null), noteId} = props;

  const [normalized, setNormalized] = useState(() => {
    return withDefault(mapSome(findNoteTree(notesIndex, noteId), normalizedNote), {...newNormalizedNote});
  });

  const audioMetadatas = useUnusedAudioFiles();
  const audioPaths = useMemo(() => audioMetadatas.map(({path}) => path), [audioMetadatas]);
  const curSelectedAudioPath = useMemo(
    () => audioMetadatas.find(({id}) => id === normalized.attributes.audioFileId)?.path || "",
    [audioMetadatas, normalized.attributes.audioFileId]
  );
  const setAudioPath = useCallback((selected: string) => {
    const md = audioMetadatas.find(({path}) => path === selected);
    if (!md) return;

    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, audioFileId: md.id,
      }
    }))
  }, [audioMetadatas])
  const playAudioPath = useCallback(async () => {
    const id = normalized.attributes.audioFileId;
    if (!id) return;

    const metadata = await store.fetchBlob(id);
    if (!metadata) return;
    const {blob, path} = metadata[0];
    await playAudio(blob, path);
  }, [normalized.attributes.audioFileId, store])

  const onApply = useCallback(async () => {
    const baseTree = findNoteTree(notesIndex, noteId);
    await props.onApply(baseTree, normalized);
  }, [notesIndex, noteId, props, normalized])

  const setNoteContent = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, content: (e.target as HTMLTextAreaElement).value
      }
    }))
  }, [])

  const setNoteLanguage = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, language: (e.target as HTMLSelectElement).value
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

        <div className="ml2 w4 dib">
          <SelectSingle
            placeholder="オーディオ "
            onChange={setAudioPath}
            value={curSelectedAudioPath}
            values={audioPaths}
          />
        </div>

        <div className="ml2 w4 dib">
          <button onClick={playAudioPath}>
            テスト
          </button>
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
          disabled={!normalized.attributes.content || !normalized.attributes.language}>
          適用
        </button>

        <button className="mh1 pa2 br2" onClick={onReturn}>
          キャンセル
        </button>
      </div>
    </div>
  </div>
}

function useUnusedAudioFiles() {
  const store = useFileStorage();
  const {notes} = useNotesIndex();
  const audioMetadatas = useLiveQuery(async () => store.fetchMetadataByExts(Object.keys(audioContentTypes)), [], []);
  return useMemo(() => audioMetadatas.filter(metadata => !!Indexer.getFirstMatching(notes.byAudioFileId,
    [metadata.id]
  )), [audioMetadatas, notes.byAudioFileId]);
}