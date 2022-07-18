import {useFileStorage, useNotesIndex, useTriggerSync} from "./contexts";
import {createContext, Dispatch, ReactElement, useCallback, useContext} from "react";
import {mapSome, Maybe, some, withDefault} from "../utils/maybe";
import {
  denormalizedNote,
  findNoteTree, normalizedNote,
  NormalizedNote,
  NoteTree,
  stringifyNote,
  updateNotes
} from "../notes";
import {createId} from "../services/storage";

export type NoteUpdateHistory = [Maybe<[NoteTree, NormalizedNote]>, Maybe<[NoteTree, NormalizedNote]>];
export const UpdateHistoryContext = createContext(
  {
    updateHistory: [null, null] as NoteUpdateHistory,
    setUpdateHistory: (() => null) as ((history: NoteUpdateHistory) => void),
  }
);

export function useNoteUpdateHistory() {
  const updateNote = useUpdateNote(false, false);
  const {updateHistory: [lastUpdate, lastUndo], setUpdateHistory} = useContext(UpdateHistoryContext);

  const undo = useCallback(async () => {
    await mapSome(lastUpdate, async lastUpdate => {
      const [tree, normalized] = lastUpdate;
      setUpdateHistory([null, some([tree, normalized])])
      await updateNote(some(tree), normalizedNote(tree));
    })
  }, [lastUpdate, setUpdateHistory, updateNote]);

  const redo = useCallback(async () => {
    await mapSome(lastUndo, async lastUndo => {
      const [tree, normalized] = lastUndo;
      setUpdateHistory([some([tree, normalized]), null])
      await updateNote(some(tree), normalized);
    })
  }, [lastUndo, setUpdateHistory, updateNote])

  return {undo, redo, hasUndo: !!lastUpdate, hasRedo: !!lastUndo};
}

export function useUpdateNote(confirmEdit = false, undoable = true) {
  const storage = useFileStorage();
  const notesIndex = useNotesIndex();
  const [triggerSync] = useTriggerSync();
  const {setUpdateHistory} = useContext(UpdateHistoryContext);

  return useCallback(async (baseTree: Maybe<NoteTree>, updated: NormalizedNote, newNoteId = createId()) => {
    const appliedTree = withDefault(mapSome(baseTree, tree => {
      if (confirmEdit) {
        const editsComplete = confirm("Set edits completed?")
        updated = {...updated, attributes: {...updated.attributes, editsComplete}};
      }
      return denormalizedNote(updated, tree.note.id, tree.note.path, tree.note.version);
    }), denormalizedNote(updated, newNoteId, `/${newNoteId}.txt`, ""));

    if (undoable) {
      mapSome(baseTree, baseTree => {
        setUpdateHistory([some([
          baseTree, updated
        ]), null])
      })
    }

    updateNotes(notesIndex, appliedTree);

    const blob = new Blob([stringifyNote(updated)]);
    await storage.storeBlob(blob, {
      path: appliedTree.note.path,
      id: appliedTree.note.id,
      rev: appliedTree.note.version,
      size: blob.size,
    }, true);

    triggerSync();
  }, [notesIndex, storage, triggerSync, confirmEdit]);
}