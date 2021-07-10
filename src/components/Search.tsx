import React, {ReactElement, useCallback, useMemo, useState} from 'react';
import {useNotesIndex, useRoute} from "../hooks/contexts";
import {SelectSingle} from "./SelectSingle";
import {SearchList} from "./SearchList";
import {filterIndexIterator, flattenIndexIterator, Indexer, IndexIterator, mapIndexIterator} from "../utils/indexable";
import {useWorkflowRouting} from "../hooks/useWorkflowRouting";
import {EditNote} from "./EditNote";
import {useUpdateNote} from "../hooks/useUpdateNote";
import {studyDetailsForCloze} from "../study";
import {bindSome, mapSome, Maybe, withDefault} from "../utils/maybe";
import {SelectTerm} from "./SelectTerm";
import {findNoteTree, newNormalizedNote, NormalizedNote, normalizedNote, NoteTree} from "../notes";
import {createId} from "../services/storage";

interface Props {
  onReturn?: () => void,
}

const searchModes = ["notes", "terms"];
export function Search(props: Props) {
  const setRoute = useRoute();

  const {onReturn = () => setRoute(() => null)} = props;

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState(searchModes[0]);
  const iterator = useSearchResults(mode, search, onReturn);

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
  const updateNote = useUpdateNote();

  const updateNoteAndConfirmEditsFinished = useCallback(async (baseTree: Maybe<NoteTree>, updated: NormalizedNote) => {
    const editsComplete = confirm("Set edits completed?")
    updated = {...updated, attributes: {...updated.attributes, editsComplete}};
    await updateNote(baseTree, updated);
  }, [updateNote])

  const noteRouting = useWorkflowRouting(EditNote, Search, updateNoteAndConfirmEditsFinished);
  const editTermRouting = useWorkflowRouting(SelectTerm, Search, updateNoteAndConfirmEditsFinished);

  const visitNote = useCallback((noteId: string) => {
    noteRouting({
      noteId,
    }, {onReturn}, () => ({onReturn}))
  }, [noteRouting, onReturn]);

  const visitTerm = useCallback((noteId: string) => {
    const normalized = withDefault(
      mapSome(findNoteTree({notes, clozeAnswers, clozes, terms}, noteId), normalizedNote),
      {...newNormalizedNote}
    );
    editTermRouting({noteId, normalized}, {onReturn}, () => ({onReturn}))
  }, [clozeAnswers, clozes, editTermRouting, notes, onReturn, terms])

  return useMemo(() => {
    if (mode === "notes") {
      let baseIterator = Indexer.iterator(notes.byEditsComplete);
      if (search) baseIterator = filterIndexIterator(baseIterator, note => note.attributes.content.includes(search))

      return mapIndexIterator(baseIterator, note => {
        return <span onClick={() => visitNote(note.id)} className={note.attributes.editsComplete ? '' : 'bg-lightest-blue'}>
          {note.attributes.content}
        </span>
      })
    } else if (mode === "terms") {
      const baseIterator = flattenIndexIterator(mapIndexIterator(
        Indexer.reverseIter(clozeAnswers.byLastAnsweredOfNoteIdReferenceMarkerAndClozeIdx),
        clozeAnswer => {
          const {noteId, marker, reference, clozeIdx} = clozeAnswer;
          const cloze = Indexer.getFirstMatching(
            clozes.byNoteIdReferenceMarkerAndClozeIdx,
            [noteId, reference, marker, clozeIdx]
          );

          if (search) {
            const term = Indexer.getFirstMatching(
              terms.byNoteIdReferenceAndMarker,
              [noteId, reference, marker]
            );
            if (!withDefault(mapSome(term,
              term => term.attributes.reference.includes(search) || term.attributes.hint.includes(search) || term.attributes.definition.includes(
                search)
            ), false)) return null;
          }

          return bindSome(cloze, cloze => studyDetailsForCloze(cloze, {notes, clozes, clozeAnswers, terms}))
        }
      ));

      return mapIndexIterator(baseIterator, details => {
        return <span onClick={() => visitTerm(details.cloze.noteId)}>
          {details.beforeTerm}<b>{details.beforeCloze}{details.clozed}{details.afterCloze}</b> {details.afterTerm}
        </span>
      })
    }

    return () => null;
  }, [clozeAnswers, clozes, mode, notes, search, terms, visitNote, visitTerm]);
}