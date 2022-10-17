import React, {ChangeEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute, useTriggerSync} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {
  findNoteTree, newNormalizedNote, NormalizedNote, normalizedNote, NoteTree,
} from "../notes";
import {mapSome, mapSomeAsync, Maybe, some, withDefault} from "../utils/maybe";
import {useLiveQuery} from "dexie-react-hooks";
import {audioContentTypes, createId, getExt, imageContentTypes, normalizeBlob, readDataUrl} from "../services/storage";
import {Indexer} from "../utils/indexable";
import {playAudio} from "../services/speechAndAudio";
import {useDataUrl} from "../hooks/useDataUrl";
import {TagsSelector} from "./TagsSelector";
import {SimpleNavLink, WorkflowLinks} from "./SimpleNavLink";
import {useWithKeybinding} from "../hooks/useWithKeybinding";
import {useOnPaste} from "../hooks/useOnPaste";
import {useCardImages} from "../hooks/useCardImages";
import {Image, Images} from "./Images";
import { SelectAudioFile } from './SelectAudioFile';
import Tesseract, { createWorker } from 'tesseract.js';
import { TakePicture } from './TakePicture';
import { useSpeechAndAudio } from '../hooks/useSpeechAndAudio';
interface Props {
  onReturn?: () => void,
  onApply: (tree: Maybe<NoteTree>, updated: NormalizedNote) => Promise<void>,
  newNoteContent?: string,
  noteId: string,
  note?: NormalizedNote,
}

const allLanguages = ['Japanese', 'Cantonese', 'English', 'Todos'];
const languageToTesseractLang: Record<string, string> = {
  'Japanese': 'jpn',
  'English': 'eng',
  'Cantonese': 'chi_tra',
  'Todos': 'eng',
};

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

  const {playAudioInScope} = useSpeechAndAudio();
  const playAudioPath = useCallback(() => {
    mapSome(audioDataUrl, (dataUrl) => playAudioInScope(dataUrl, null, null));
  }, [audioDataUrl])

  const [CaptureWrapper] = useWithKeybinding('o', playAudioPath)
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

  const setShareAudio = useCallback((shareAudio: boolean) => {
    setNormalized(note => ({
      ...note, attributes: {
        ...note.attributes, shareAudio
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

  const [processing, setProcessing] = useState(false);

  const readImage = useCallback(async (f: File) => {
    const lang = languageToTesseractLang[normalized.attributes.language];
    if (!lang) return;
    
    let wasProcessing = false;
    setProcessing(processing => {
      wasProcessing = processing;
      return true;
    });
    if (wasProcessing) return;

    try {
      const worker = createWorker({
        logger: m => console.log(m),
        errorHandler: e => console.error(e),
      });
          
      try { 
        await worker.load();
        await worker.loadLanguage(lang);
        await worker.initialize(lang);
        const { data: { text } } = await worker.recognize(f);
        setNormalized(note => ({
          ...note, attributes: {
            ...note.attributes, content: note.attributes.content + text + "\n",
          }
        }));
      } finally {
        await worker.terminate();
      }
    } finally {
      setProcessing(false);
    }
  }, [normalized.attributes.language]);

  const images = useCardImages(normalized.attributes.imageFilePaths);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      </div>

      <TagsSelector value={normalized.attributes.tags} language={normalized.attributes.language} onChange={setNoteTags}>
        <label className="dib ml2">
            SG<input
            className="ml2 mr3"
            type="checkbox"
            onChange={e => setNoteStudyGuide(e.target.checked)}
            checked={normalized.attributes.studyGuide}
          />
        </label>

        <label className="dib ml2">
            SA<input
            className="ml2 mr3"
            type="checkbox"
            onChange={e => setShareAudio(e.target.checked)}
            checked={normalized.attributes.shareAudio}
          />
        </label>
      </TagsSelector>

      <div>
        <div className="ml2 dib">
          <button onClick={playAudioPath}>
            <PlayWrapper>
              テスト
            </PlayWrapper>
          </button>
        </div>

        <div className="ml2 dib">
          <TakePicture onPicture={readImage}/>
        </div>
      </div>
    </div>

    <div className="mw6 center">
      <div className="pt3">
        <textarea
            disabled={processing}
            className="w-100 input-reset"
            rows={6}
            onChange={setNoteContent}
            value={normalized.attributes.content}
          />
      </div>

      <Images images={images} onClick={removeImage}/>

      <div className="tr">
        <SimpleNavLink className="mh1 pa2 br2" onClick={deleteNote}>
            <DeleteWrapper>
              削除
            </DeleteWrapper>
        </SimpleNavLink>
        <WorkflowLinks onApply={onApply} onReturn={onReturn} applyDisabled={!normalized.attributes.content || !normalized.attributes.language}/>
      </div>
    </div>
  </div>
}

function useUnusedAudioFiles() {
  const store = useFileStorage();
  const {notes} = useNotesIndex();
  const audioMetadatas = useLiveQuery(async () => store.fetchMetadataByExts(Object.keys(audioContentTypes)), [], []);
  return useMemo(() => audioMetadatas.filter(metadata => withDefault(mapSome(Indexer.getFirstMatching(notes.byAudioFileId, [metadata.id]), note => note.attributes.shareAudio), true) && metadata.rev && !metadata.deleted), [audioMetadatas, notes.byAudioFileId]);
}
