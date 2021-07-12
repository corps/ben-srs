import React, {ChangeEvent, ReactElement, useCallback, useMemo, useState} from 'react';
import {useFileStorage, useNotesIndex, useRoute} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {SearchList} from "./SearchList";
import {filterIndexIterator, flattenIndexIterator, Indexer, IndexIterator, mapIndexIterator} from "../utils/indexable";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {studyDetailsForCloze} from "../study";
import {bindSome, mapSome, some, withDefault} from "../utils/maybe";
import {SelectTerm} from "./SelectTerm";
import {findNoteTree, newNormalizedNote, normalizedNote} from "../notes";
import {
  allContentTypes, audioContentTypes, createId, StoredMetadata, videoContentTypes, withNamespace
} from "../services/storage";
import {useLiveQuery} from "dexie-react-hooks";
import {SimpleNavLink} from "./SimpleNavLink";
import {useStoredState} from "../hooks/useStoredState";

interface Props {
  onReturn?: () => void,
}

export const mediaEditingStorage = withNamespace(localStorage, 'mediaEditing');

const searchModes = ["notes", "terms", "media"];

export function Search(props: Props) {
  const setRoute = useRoute();
  const store = useFileStorage();

  const {onReturn = () => setRoute(() => null)} = props;

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState(searchModes[0]);
  const iterator = useSearchResults(mode, search, onReturn);
  const [password, setPassword] = useStoredState(mediaEditingStorage, 'password', '');

  const uploadFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const {target: {files}} = e;
    if (!files) return;
    for (let i = 0; i < files.length; ++i) {
      const file = files[i];
      const [ext] = Object.entries(allContentTypes).find(([ext, mime]) => file.type === mime) || [''];

      const id = createId();
      await store.storeBlob(file,
        {path: `/${id}-${file.name.split('.').slice(0, 1)[0]}.${ext}`, id, rev: "", size: file.size},
        true
      );
    }
  }, [store])

  const fromYoutube = useCallback(async () => {
    const url = prompt("Enter a youtube url");
    if (!url) return;
    const response = await fetch(location.origin + '/youtubedl.sh?pw=' + password, {
      method: 'POST', body: url
    });

    try {
      if (response.status === 200) {
        console.log('response status is good');
        const blob = await response.blob();
        console.log('got blob');
        const filenameMatch = response.headers.get('Content-Disposition')?.match(/filename="(.*)"/);
        let fileName;

        const id = createId();
        if (filenameMatch) {
          fileName = filenameMatch[1];
        } else {
          fileName = id + ".mp4";
        }
        console.log({fileName});

        await store.storeBlob(blob,
          {path: `/${fileName}`, id, rev: "", size: blob.size},
          true
        );
        alert('Success!');
      }
    } catch (e) {
      alert('Failed!');
      console.error(e);
    }
  }, [password, store]);

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

function useSearchResults(mode: string, search: string, onReturn: () => void): IndexIterator<ReactElement> {
  const {notes, clozeAnswers, clozes, terms} = useNotesIndex();
  const updateNoteAndConfirmEditsFinished = useUpdateNote(true);
  const store = useFileStorage();

  const unsortedMediaData = useLiveQuery(() => store.fetchMetadataByExts(Object.keys({...audioContentTypes, ...videoContentTypes})),
    [],
    []
  );
  const mediaMetadata = useMemo(() =>
    unsortedMediaData.sort((a, b) => b.updatedAt - a.updatedAt),
    [unsortedMediaData])

  const deleteFile = useCallback((id: string) => {
    if (confirm("Delete?")) store.markDeleted(id);
  }, [store])

  const downloadFile = useCallback(async (id: string) => {
    const stored = await store.fetchBlob(id);
    if (!stored) return;
    const {blob, path} = stored[0];
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const e = document.createEvent('MouseEvents');
    const a = document.createElement('a')
    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  [blob.type, a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
  }, [store]);

  const selectTermRouting = useWorkflowRouting(SelectTerm, Search, updateNoteAndConfirmEditsFinished);
  const visitNote = useCallback((noteId: string) => {
    const normalized = withDefault(mapSome(findNoteTree({notes, clozeAnswers, clozes, terms}, noteId), normalizedNote),
      {...newNormalizedNote}
    );
    selectTermRouting({noteId, normalized}, {onReturn}, () => ({onReturn}))
  }, [clozeAnswers, clozes, selectTermRouting, notes, onReturn, terms])

  return useMemo(() => {
    if (mode === "notes") {
      let baseIterator = Indexer.iterator(notes.byEditsComplete);
      if (search) baseIterator = filterIndexIterator(baseIterator, note => note.attributes.content.includes(search))

      return mapIndexIterator(baseIterator, note => {
        return <span onClick={() => visitNote(note.id)}
                     className={note.attributes.editsComplete ? '' : 'bg-lightest-blue'}>
          {note.attributes.content}
        </span>
      })
    } else if (mode === "terms") {
      const baseIterator = flattenIndexIterator(mapIndexIterator(Indexer.reverseIter(clozeAnswers.byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx),
        clozeAnswer => {
          const {noteId, marker, reference, clozeIdx} = clozeAnswer;
          const cloze = Indexer.getFirstMatching(clozes.byNoteIdReferenceMarkerAndClozeIdx,
            [noteId, reference, marker, clozeIdx]
          );

          if (search) {
            const term = Indexer.getFirstMatching(terms.byNoteIdReferenceAndMarker, [noteId, reference, marker]);
            if (!withDefault(mapSome(term,
              term => term.attributes.reference.includes(search) || term.attributes.hint.includes(search) || term.attributes.definition.includes(
                search)
            ), false)) return null;
          }

          return bindSome(cloze, cloze => studyDetailsForCloze(cloze, {notes, clozes, clozeAnswers, terms}))
        }
      ));

      return mapIndexIterator(baseIterator, details => {
        return <span onClick={() => visitNote(details.cloze.noteId)}>
          {details.beforeTerm}<b>{details.beforeCloze}{details.clozed}{details.afterCloze}</b> {details.afterTerm}
        </span>
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

      return mapIndexIterator(baseIter, md => <span onClick={() => downloadFile(md.id)}>
        <SimpleNavLink onClick={() => deleteFile(md.id)}>Delete</SimpleNavLink> - {md.path}
      </span>)
    }

    return () => null;
  }, [clozeAnswers, clozes, deleteFile, downloadFile, mediaMetadata, mode, notes, search, terms, visitNote]);
}