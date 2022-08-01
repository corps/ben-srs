import React, {ChangeEvent, useCallback, useEffect, useMemo, useState} from 'react';
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
import {runPromise, useAsync} from "../cancellable";

const imageExts = ["png", "jpeg", "gif", "bmp", "jpg", "svg", "ico", "tiff"]

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
        if (!(ext in imageContentTypes)) return;

        const id = createId();
        await store.storeBlob(f, {
          path: `/${id}.${ext}`,
          id,
          rev: "",
          size: f.size,
        }, true);


        setNormalized(note => ({
          ...note, attributes: {
            ...note.attributes, imageFileIds: [...note.attributes.imageFileIds || [], id],
          }
        }))
      }), Promise.resolve());
    }

    triggerSync()
  }, [triggerSync, setNormalized]);
  const removeImage = useCallback((toRemove: string) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes,
        imageFileIds: (note.attributes.imageFileIds || []).filter(id => id !== toRemove),
      }
    }))
  }, [])

  const allAudioMetadatas = useLiveQuery(async () => store.fetchMetadataByExts(Object.keys(audioContentTypes)), [], []);
  const audioMetadatas = useUnusedAudioFiles();
  const audioPaths = useMemo(() => audioMetadatas.map(({path}) => path), [audioMetadatas]);
  const curSelectedAudioPath = useMemo(
    () => allAudioMetadatas.find(({id}) => id === normalized.attributes.audioFileId)?.path || "",
    [allAudioMetadatas, normalized.attributes.audioFileId]
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
  const audioDataUrl = useDataUrl(normalized.attributes.audioFileId);
  const playAudioPath = useCallback(() => {
    mapSome(audioDataUrl, playAudio);
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

  const [dataUrls, setDataUrls] = useState({} as {[k: string]: string});
  useAsync(function *() {
    const imageIds = (normalized.attributes.imageFileIds || []);
    const dataUrls: Record<string, string> = {};
    for (let imageId of imageIds) {
      const media = yield* runPromise(store.fetchBlob(imageId));
      if (media) {
        const dataUrl = yield* runPromise(readDataUrl(normalizeBlob(media[0].blob)));
        dataUrls[imageId] = dataUrl;
      }
    }

    setDataUrls(dataUrls);
  }, [normalized.attributes.imageFileIds, store])

  const images = (normalized.attributes.imageFileIds || [])
    .map(imageId => ({url: dataUrls[imageId], imageId})).filter(i => !!i.url);

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
            placeholder={curSelectedAudioPath || "オーディオ "}
            onChange={setAudioPath}
            value={curSelectedAudioPath}
            values={audioPaths}
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
      <div className="pa3">
        <textarea
          className="w-100 input-reset"
          rows={6}
          onChange={setNoteContent}
          value={normalized.attributes.content}
        />
      </div>

      {images.length === 0 ? null : <div className="pb3">
        <div className="cf">
          { images.map(({url, imageId}) => <div className="fl w-50 w-25-m w-20-l pa2">
            <a href="#" className="db link dim tc" onClick={() => removeImage(imageId)}>
              <img src={url} className="w-100 db outline black-10"/>
            </a>
          </div>) }
        </div>
      </div>
      }

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