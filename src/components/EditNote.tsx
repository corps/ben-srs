import React, {ChangeEvent, useCallback, useMemo, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute, useTriggerSync} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {
  findNoteTree, newNormalizedNote, NormalizedNote, normalizedNote, NoteTree,
} from "../notes";
import {mapSome, mapSomeAsync, Maybe, withDefault} from "../utils/maybe";
import {useLiveQuery} from "dexie-react-hooks";
import {audioContentTypes, createId, getExt, imageContentTypes, normalizeBlob, readDataUrl} from "../services/storage";
import {Indexer} from "../utils/indexable";
import {playAudio} from "../services/speechAndAudio";
import {useDataUrl} from "../hooks/useDataUrl";
import {TagsSelector} from "./TagsSelector";
import {WorkflowLinks} from "./SimpleNavLink";
import {useWithKeybinding} from "../hooks/useWithKeybinding";
import {useOnPaste} from "../hooks/useOnPaste";
import {useCardImages} from "../hooks/useCardImages";
import {Image, Images} from "./Images";
import { SelectAudioFile } from './SelectAudioFile';
interface Props {
  onReturn?: () => void,
  onApply: (tree: Maybe<NoteTree>, updated: NormalizedNote) => Promise<void>,
  newNoteContent?: string,
  noteId: string,
  note?: NormalizedNote,
}

const allLanguages = ['Japanese', 'Cantonese', 'English', 'Todos'];

export function EditNote(props: Props) {
  const notesIndex = useNotesIndex();
  const setRoute = useRoute();
  const store = useFileStorage();

  const {onReturn = () => setRoute(() => null), noteId, newNoteContent, note} = props;

  const [normalized, setNormalized] = useState(() => {
    if (note) {
      return note;
    } else {
      return withDefault(
        mapSome(
          findNoteTree(notesIndex, noteId || ''), normalizedNote),
        {...newNormalizedNote, attributes: {...newNormalizedNote.attributes, content: newNoteContent || ''}});
    }
  });

  const [triggerSync] = useTriggerSync();
  const deleteNote = useCallback(async () => {
    if (confirm("Delete?")) {
      setRoute(() => null);
      await store.markDeleted(noteId);
      triggerSync();
    }
  }, [noteId, setRoute, store, triggerSync]);

  useOnPaste(async (files: File[]) => {
    for (let f of files) {
      await withDefault(mapSome(getExt(f.name), async (ext: string) => {
        const isImage = ext in imageContentTypes;
        const isAudio = ext in audioContentTypes;
        if (!isImage && !isAudio) return;

        const id = createId();
        const path = `/${id}.${ext}`;
        await store.storeBlob(f, {
          path,
          id,
          rev: "",
          size: f.size,
        }, true);


        if (isImage) {
          setNormalized(note => ({
            ...note, attributes: {
              ...note.attributes, imageFilePaths: [...note.attributes.imageFilePaths || [], path],
            }
          }))
        }
      }), Promise.resolve());
    }

    triggerSync()
  }, [triggerSync, setNormalized]);

  const removeImage = useCallback((toRemove: Image) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes,
        imageFilePaths: (note.attributes.imageFilePaths || []).filter(path => path !== toRemove.imageFilePath),
      }
    }))
  }, [])

  const allAudioMetadatas = useLiveQuery(async () => store.fetchMetadataByExts(Object.keys(audioContentTypes)), [], []);
  const audioMetadatas = useUnusedAudioFiles();

  const setAudioFileId = useCallback((selectedId: Maybe<string>) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, audioFileId: withDefault(selectedId, ""),
      }
    }))
  }, [])

  const audioDataUrl = useDataUrl(normalized.attributes.audioFileId);
  const playAudioPath = useCallback(() => {
    mapSome(audioDataUrl, (dataUrl) => playAudio(dataUrl, null, null));
  }, [audioDataUrl])

  const [PlayWrapper] = useWithKeybinding('j', playAudioPath)
  const [DeleteWrapper] = useWithKeybinding('Delete', deleteNote);

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

  const setNoteLanguage = useCallback((language: string) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, language
      }
    }))
  }, [])

  const setNoteStudyGuide = useCallback((studyGuide: boolean) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, studyGuide
      }
    }))
  }, [])

  const setNoteTags = useCallback((tags: string[]) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, tags
      }
    }))
  }, [])

  const images = useCardImages(normalized.attributes.imageFilePaths);

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
          <SelectAudioFile
            value={normalized.attributes.audioFileId || ""}
            options={audioMetadatas}
            onChange={setAudioFileId}
          />
        </div>

        <label className="dib ml2">
            SG<input
            className="ml2 mr3"
            type="checkbox"
            onChange={e => setNoteStudyGuide(e.target.checked)}
            checked={normalized.attributes.studyGuide}
          />
        </label>

          <div className="ml2 dib">
          <button onClick={playAudioPath}>
            <PlayWrapper>
              テスト
            </PlayWrapper>
          </button>
        </div>

        <div className="ml2 dib">
          <button onClick={deleteNote}>
            <DeleteWrapper>
              削除
            </DeleteWrapper>
          </button>
        </div>
      </div>

      <TagsSelector value={normalized.attributes.tags} language={normalized.attributes.language} onChange={setNoteTags}/>
    </div>

    <div className="mw6 center">
      <div className="pt3">
        <textarea
          className="w-100 input-reset"
          rows={6}
          onChange={setNoteContent}
          value={normalized.attributes.content}
        />
      </div>

      <Images images={images} onClick={removeImage}/>

      <div className="tr">
        <WorkflowLinks onApply={onApply} onReturn={onReturn} applyDisabled={!normalized.attributes.content || !normalized.attributes.language}/>
      </div>
    </div>
  </div>
}

function useUnusedAudioFiles() {
  const store = useFileStorage();
  const {notes} = useNotesIndex();
  const audioMetadatas = useLiveQuery(async () => store.fetchMetadataByExts(Object.keys(audioContentTypes)), [], []);
  return useMemo(() => audioMetadatas.filter(metadata => !Indexer.getFirstMatching(notes.byAudioFileId,
    [metadata.id]
  ) && metadata.rev && !metadata.deleted), [audioMetadatas, notes.byAudioFileId]);
}
