import { makeContextual } from './makeContextual';
import { useState } from 'react';
import { indexesInitialState } from '../notes';

export const [useNotesIndex, NotesIndexContext] = makeContextual(
  function useNotesIndex() {
    return useState(() => ({ ...indexesInitialState }));
  }
);
