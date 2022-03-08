import React, {ChangeEvent, ReactElement, useCallback, useMemo, useState} from 'react';
import {saveAs} from "file-saver"
import {useFileStorage, useNotesIndex, useRoute, useTriggerSync} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {SearchList} from "./SearchList";
import {
  chainIndexIterators,
  filterIndexIterator,
  flattenIndexIterator,
  Indexer,
  IndexIterator,
  mapIndexIterator
} from "../utils/indexable";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {studyDetailsForCloze} from "../study";
import {bindSome, mapSome, mapSomeAsync, some, withDefault} from "../utils/maybe";
import {SelectTerm} from "./SelectTerm";
import {findNoteTree, newNormalizedNote, normalizedNote, Term} from "../notes";
import { audioContentTypes, createId, getExt, normalizeBlob, StoredMetadata, videoContentTypes, withNamespace } from "../services/storage";
import {useLiveQuery} from "dexie-react-hooks";
import {SimpleNavLink} from "./SimpleNavLink";
import {useStoredState} from "../hooks/useStoredState";
import {EditTerm} from "./EditTerm";

interface Props {
  onReturn?: () => void,
  defaultSearch?: string,
  defaultMode?: string,
}

export const mediaEditingStorage = withNamespace(localStorage, 'mediaEditing');

const searchModes = ["notes", "terms", "media"];

export function Search(props: Props) {
  const setRoute = useRoute();
  const store = useFileStorage();

  const {onReturn = () => setRoute(() => null), defaultSearch = "", defaultMode = searchModes[0]} = props;

  const [search, setSearch] = useState(defaultSearch);
  const [mode, setMode] = useState(defaultMode);
  const [triggerSync, lastSync] = useTriggerSync();
  const iterator = useSearchResults(mode, search, lastSync, onReturn);
  const [password, setPassword] = useStoredState(mediaEditingStorage, 'password', '');

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

  const fromYoutube = useCallback(async () => {
    const url = prompt("Enter a youtube url");
    if (!url) return;
    const response = await fetch(location.origin + '/youtubedl.sh?pw=' + password, {
      method: 'POST', body: url
    });

    try {
      if (response.status === 200) {
        const blob = await response.blob();
        const filenameMatch = response.headers.get('Content-Disposition')?.match(/filename="(.*)"/);
        let fileName;

        const id = createId();
        if (filenameMatch) {
          fileName = filenameMatch[1];
        } else {
          fileName = id + ".mp4";
        }

        await store.storeBlob(blob,
          {path: `/${fileName}`, id, rev: "", size: blob.size},
          true
        );
        triggerSync();
        alert('Success!');
      }
    } catch (e) {
      alert('Failed!');
      console.error(e);
    }
  }, [password, store, triggerSync]);

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
          <input type="file"
                 onChange={uploadFile}
          />
          <input type="text"
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="password for youtube"
          />
        </div>
        <div className="w-100">
          <button onClick={fromYoutube}>From Youtube</button>
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

function useSearchResults(mode: string, search: string, lastSync: number, onReturn: () => void): IndexIterator<ReactElement> {
  const notesIndex = useNotesIndex();
  const {notes, clozeAnswers, clozes, terms} = notesIndex;
  const updateNoteAndConfirmEditsFinished = useUpdateNote(true);
  const store = useFileStorage();

  const unsortedMediaData = useLiveQuery(() => store.fetchMetadataByExts(Object.keys({...audioContentTypes, ...videoContentTypes})),
    [],
    []
  );
  const mediaMetadata = useMemo(() =>
    [...unsortedMediaData].sort((a, b) => b.updatedAt - a.updatedAt),
    [unsortedMediaData])
  const [triggerSync] = useTriggerSync();

  const deleteFile = useCallback(async (id: string) => {
    if (confirm("Delete?")) {
      await store.markDeleted(id);
      triggerSync();
    }
  }, [store, triggerSync])

  const downloadFile = useCallback(async (id: string) => {
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

  const selectTermRouting = useWorkflowRouting(SelectTerm, ({onReturn}: Props) => <Search onReturn={onReturn} defaultSearch={search} defaultMode={mode}/>, updateNoteAndConfirmEditsFinished);
  const editTermRouting = useWorkflowRouting(EditTerm, ({onReturn}: Props) => <Search onReturn={onReturn} defaultSearch={search} defaultMode={mode}/>, updateNoteAndConfirmEditsFinished);

  const visitNote = useCallback((noteId: string) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, noteId), normalizedNote),
      {...newNormalizedNote}
    );
    selectTermRouting({noteId, normalized}, {onReturn}, () => ({onReturn}))
  }, [notesIndex, selectTermRouting, onReturn])

  const visitTerm = useCallback((noteId: string, reference: string, marker: string) => {
    const normalized = withDefault(mapSome(findNoteTree(notesIndex, noteId), normalizedNote),
      {...newNormalizedNote}
    );
    editTermRouting({noteId, reference, marker, normalized}, {onReturn}, () => ({onReturn}))
  }, [notesIndex, editTermRouting, onReturn])


  return useMemo(() => {
    if (mode === "notes") {
      let baseIterator = Indexer.iterator(notes.byEditsComplete);
      if (search) baseIterator = filterIndexIterator(baseIterator, note => note.attributes.content.includes(search) || note.attributes.tags.includes(search))

      return mapIndexIterator(baseIterator, note => {
        return <a href="javascript:void(0)" tabIndex={0} key={note.id} onClick={() => visitNote(note.id)}
                     className={`no-underline color-inherit ${note.attributes.editsComplete ? '' : 'bg-lightest-blue'}`}>
          {note.attributes.content}
        </a>
      })
    } else if (mode === "terms") {
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

      const baseIterator = filteredTermIter(
            term => term.attributes.reference.indexOf(search) === 0);

      return mapIndexIterator(baseIterator, ({beforeTerm, beforeCloze, clozed, afterCloze, afterTerm, cloze}) => {
        return <a href="javascript:void(0)" className="no-underline color-inherit" tabIndex={0} key={cloze.noteId + cloze.reference + cloze.marker} onClick={() => visitTerm(cloze.noteId, cloze.reference, cloze.marker)}>
          {beforeTerm.slice(Math.max(beforeTerm.length - 12, 0))}<b>{beforeCloze}{clozed}{afterCloze}</b> {afterTerm}
        </a>
      })
    } else if (mode === "media") {
      let i = 0;
      let baseIter: IndexIterator<StoredMetadata> = () => {
        if (i >= mediaMetadata.length) return null;
        return some(mediaMetadata[i++]);
      }

      baseIter = filterIndexIterator(baseIter, md => !md.deleted && !!md.rev);
      if (search) {
        baseIter = filterIndexIterator(baseIter, md => md.path.includes(search));
      }

      return mapIndexIterator(baseIter, md => <span key={md.path}>
        <SimpleNavLink onClick={() => deleteFile(md.id)}>Delete</SimpleNavLink>
        <a href="javascript:void(0)" className="no-underline color-inherit" tabIndex={0} onClick={() => downloadFile(md.id)}> - {md.path}</a>
      </span>)
    }

    return () => null;
  }, [clozeAnswers.byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx, clozes.byNoteIdReferenceMarkerAndClozeIdx, deleteFile, downloadFile, mediaMetadata, mode, notes.byEditsComplete, notesIndex, search, terms.byNoteIdReferenceAndMarker, visitNote, visitTerm]);
}