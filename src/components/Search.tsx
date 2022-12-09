import React, {ChangeEvent, ReactElement, useCallback, useMemo, useState} from 'react';
import {saveAs} from "file-saver"
import {useFileStorage, useNotesIndex, useRoute, useTriggerSync} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {SearchList} from "./SearchList";
import {
  asIterator, filterIndexIterator, flattenIndexIterator, Indexer, IndexIterator, mapIndexIterator
} from "../utils/indexable";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {StudyDetails, studyDetailsForCloze} from "../study";
import {bindSome, mapSome, mapSomeAsync, some, withDefault} from "../utils/maybe";
import {SelectTerm} from "./SelectTerm";
import {findNoteTree, newNormalizedNote, normalizedNote, Note, Term} from "../notes";
import { audioContentTypes, createId, getExt, normalizeBlob, StoredMetadata, videoContentTypes, withNamespace } from "../services/storage";
import {useLiveQuery} from "dexie-react-hooks";
import {EditTerm} from "./EditTerm";
import {NoteSearchResult} from "./NoteSearchResult";
import {TermSearchResult} from "./TermSearchResult";
import {MediaSearchResult} from "./MediaSearchResult";

interface Props {
  onReturn?: () => void,
  defaultSearch?: string,
  defaultMode?: string,
  onApply?: (studyDetails: StudyDetails) => Promise<void>,
}


const searchModes = ["notes", "terms", "media"];

export function Search(props: Props) {
  const setRoute = useRoute();
  const store = useFileStorage();

  const defaultOnReturn = useCallback(() => setRoute(() => null), [setRoute]);

  const {onReturn = defaultOnReturn, defaultSearch = "", defaultMode = searchModes[0]} = props;

  const [search, setSearch] = useState(defaultSearch);
  const [mode, setMode] = useState(defaultMode);
  const [triggerSync, lastSync] = useTriggerSync();
  const iterator = useSearchResults(mode, search, lastSync, onReturn, props.onApply);

  const uploadFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const {target: {files}} = e;
    if (!files) return;
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      await mapSomeAsync(getExt(file.name), async ext => {
        const filename = file.name.split('.').slice(0, 1)[0].toLowerCase() + '.' + ext;

        const id = createId();
        alert(`storing /${id}-${filename}`)
        await store.storeBlob(file,
          {path: `/${id}-${filename}`, id, rev: "", size: file.size},
          true
        );
        triggerSync();
      });
    }
  }, [store, triggerSync])

  return <SearchList iterator={iterator} onReturn={onReturn}>
    <div className="lh-copy f4 mt3">
      <div>
        検索モード:
        <div className="w-100">
          <SelectSingle
            values={searchModes}
            onChange={setMode}
            value={mode}
            className="w-100"
          />
        </div>
      </div>
      {mode === "media" && <div>
        アップロード:
        <div className="w-100">
          <input type="file" onChange={uploadFile}/>
        </div>
      </div>}
      <div>
        検索キーワード:
        <div className="w-100">
          <input type="text"
                 onChange={(e) => setSearch(e.target.value)}
                 value={search}
                 className="w-100"
          />
        </div>
      </div>
    </div>
  </SearchList>;
}

function useNoteSearch(search: string): IndexIterator<Note> {
  const notesIndex = useNotesIndex();
  const {notes} = notesIndex;
  let iter = Indexer.iterator(notes.byEditsComplete);
  if (search) iter = filterIndexIterator(iter, note => note.attributes.content.includes(search) || note.attributes.tags.includes(search))
  return iter;
}

function useTermSearch(search: string): IndexIterator<StudyDetails> {
  const notesIndex = useNotesIndex();
  const {clozeAnswers, clozes, terms} = notesIndex;

  return useMemo(() => {
    function filteredTermIter(predicate: (t: Term) => boolean) {
      return flattenIndexIterator(mapIndexIterator(Indexer.reverseIter(clozeAnswers.byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx),
        clozeAnswer => {
          const {noteId, marker, reference, clozeIdx} = clozeAnswer;
          const cloze = Indexer.getFirstMatching(clozes.byNoteIdReferenceMarkerAndClozeIdx,
            [noteId, reference, marker, clozeIdx]
          );

          if (search) {
            const term = Indexer.getFirstMatching(terms.byNoteIdReferenceAndMarker, [noteId, reference, marker]);
            if (!withDefault(mapSome(term, predicate), false)) return null;
          }

          return bindSome(cloze, cloze => studyDetailsForCloze(cloze, notesIndex))
        }
      ))
    }

    return filteredTermIter(term => term.attributes.reference.indexOf(search) === 0);
  }, [clozeAnswers.byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx, clozes.byNoteIdReferenceMarkerAndClozeIdx, notesIndex, search, terms.byNoteIdReferenceAndMarker])
}

function useMediaSearch(search: string): IndexIterator<StoredMetadata> {
  const store = useFileStorage();
  let i = 0;

  const unsortedMediaData = useLiveQuery(() => store.fetchMetadataByExts(Object.keys({...audioContentTypes, ...videoContentTypes})),
    [],
    []
  );
  const mediaMetadata = useMemo(() =>
      [...unsortedMediaData].sort((a, b) => b.updatedAt - a.updatedAt),
    [unsortedMediaData])

  return useMemo(() => {
    let iter: IndexIterator<StoredMetadata> = () => {
      if (i >= mediaMetadata.length) return null;
      return some(mediaMetadata[i++]);
    }

    iter = filterIndexIterator(iter, md => !md.deleted && !!md.rev);
    if (search) {
      iter = filterIndexIterator(iter, md => md.path.includes(search));
    }

    return iter;
  }, [i, mediaMetadata, search])
}

function useSearchResults(mode: string, search: string, lastSync: number, onReturn: () => void, onApply: ((studyDetails: StudyDetails) => Promise<void>) | undefined): IndexIterator<ReactElement> {
  const notesIndex = useNotesIndex();
  const updateNoteAndConfirmEditsFinished = useUpdateNote(true);
  const store = useFileStorage();
  const [triggerSync] = useTriggerSync();

  const deleteFile = useCallback(async ({id}: StoredMetadata) => {
    if (confirm("Delete?")) {
      await store.markDeleted(id);
      triggerSync();
    }
  }, [store, triggerSync])

  const downloadFile = useCallback(async ({id}: StoredMetadata) => {
    try {
      const stored = await store.fetchBlob(id);
      if (!stored) return;
      const {blob, path} = stored[0];
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      const normalized = normalizeBlob(blob);
      saveAs(normalized, filename);
    } catch(e) {
      alert(e);
    }
  }, [store]);

  const selectTermRouting = useWorkflowRouting(SelectTerm,
      ({onReturn}: Props) => <Search onReturn={onReturn} defaultSearch={search} defaultMode={mode}/>,
      updateNoteAndConfirmEditsFinished);
  const editTermRouting = useWorkflowRouting(EditTerm,
      ({onReturn}: Props) => <Search onReturn={onReturn} defaultSearch={search} defaultMode={mode}/>,
      updateNoteAndConfirmEditsFinished);

  const visitNote = useCallback((note: Note) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, note.id), normalizedNote),
      {...newNormalizedNote}
    );
    selectTermRouting({noteId: note.id, normalized}, {onReturn}, () => ({onReturn}))
  }, [notesIndex, selectTermRouting, onReturn])

  const visitTerm = useCallback((sd: StudyDetails) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, sd.cloze.noteId), normalizedNote),
      {...newNormalizedNote}
    );
    const {noteId, reference, marker} = sd.cloze;
    editTermRouting({noteId, reference, marker, normalized}, {onReturn}, () => ({onReturn}))
  }, [notesIndex, editTermRouting, onReturn])

  const notesIter = useNoteSearch(search);
  const termsIter = useTermSearch(search);
  const mediaIter = useMediaSearch(search);

  const renderedNotes = useMemo(() => {
    return mapIndexIterator(notesIter, note => {
      return <NoteSearchResult note={note} selectRow={visitNote}/>
    })
    // eslint-disable-next-line
  }, [notesIter])

  const renderedTerms = useMemo(() => {
    return mapIndexIterator(termsIter, sd => {
      return <TermSearchResult studyDetails={sd} selectRow={onApply || visitTerm}/>
    })
    // eslint-disable-next-line
  }, [termsIter])

  const renderedMedia = useMemo(() => {
    return mapIndexIterator(mediaIter, md => <MediaSearchResult md={md} selectRow={downloadFile} deleteFile={deleteFile}/>)
    // eslint-disable-next-line
  }, [mediaIter])

  if (mode === "notes") {
    return renderedNotes
  } else if (mode === "terms") {
    return renderedTerms
  } else if (mode === "media") {
    return renderedMedia
  }

  return asIterator([] as any[]);
}
