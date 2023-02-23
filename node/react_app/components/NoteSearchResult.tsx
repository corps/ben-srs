import React from 'react';
import { Note } from '../notes';

interface Props {
  note: Note;
  selectRow: (note: Note) => void;
}

export function NoteSearchResult({ note, selectRow }: Props) {
  return (
    <a
      href="javascript:void(0)"
      tabIndex={0}
      key={note.id}
      onClick={() => selectRow(note)}
      className={`no-underline color-inherit ${
        note.attributes.editsComplete ? '' : 'bg-lightest-blue'
      }`}
    >
      {note.attributes.content}
    </a>
  );
}
