import { useCallback } from 'react';
import { mapSome, Maybe, some, withDefault } from '../../shared/maybe';
import { DenormalizedNote, NoteTree, stringifyNote } from '../notes';
import { useFileStorage } from './useFileStorage';
import { createId } from '../services/storage';
import { useNotesIndex } from './useNotesIndex';
import { useSync } from './useSync';
import { expandedNote, updateNotes } from '../services/indexes';

export function useUpdateNote(confirmEdit = false) {
  const storage = useFileStorage();
  const [notesIndex, setNotesIndex] = useNotesIndex();
  const { triggerSync } = useSync();

  return useCallback(
    async (
      baseTree: Maybe<NoteTree>,
      updated: DenormalizedNote,
      newNoteId = createId()
    ) => {
      const appliedTree = withDefault(
        mapSome(baseTree, (tree) => {
          if (confirmEdit) {
            const editsComplete = confirm('Set edits completed?');
            updated = {
              ...updated,
              attributes: { ...updated.attributes, editsComplete }
            };
          }
          return expandedNote(
            updated,
            tree.note.id,
            tree.note.path,
            tree.note.version
          );
        }),
        expandedNote(updated, newNoteId, `/${newNoteId}.txt`, '')
      );

      updateNotes(notesIndex, appliedTree);
      setNotesIndex({ ...notesIndex });

      const blob = new Blob([stringifyNote(updated)]);
      await storage.storeBlob(
        blob,
        {
          path: appliedTree.note.path,
          id: appliedTree.note.id,
          rev: appliedTree.note.version,
          size: blob.size
        },
        true
      );

      triggerSync();
    },
    [notesIndex, setNotesIndex, storage, triggerSync, confirmEdit]
  );
}
