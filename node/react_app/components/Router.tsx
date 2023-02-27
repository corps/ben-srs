import React, { useState } from 'react';
import { MainMenu } from './MainMenu';
import { ProgressBar } from './ProgressBar';
import { useSync } from '../hooks/useSync';
import { withDefault } from '../../shared/maybe';
import { useQuery } from '../hooks/useQuery';
import { Search } from './Search';
import { EditNote } from './EditNote';
import { useUpdateNote } from '../hooks/useUpdateNote';
import { createId } from '../services/storage';
import { useWorkflowRouting } from '../hooks/useWorkflowRouting';
import { useRoute } from '../hooks/useRoute';

export function Router() {
  const {error: syncError, pending, completed} = useSync();
  const syncFailed = !!syncError;

  const [route] = useRoute();
  const ele = withDefault(route, <MainMenu syncFailed={syncFailed} />);
  const query = useQuery();

  const updateNote = useUpdateNote();
  const newNoteRouting = useWorkflowRouting(EditNote, null, updateNote);
  const searchRouting = useWorkflowRouting(Search, null);

  useState(() => {
    if (query.s) {
      searchRouting({ defaultSearch: query.s }, {});
    } else if (query.c) {
      newNoteRouting(
        { noteId: createId(), newNoteContent: query.c },
        {}
      );
    }
  });

  return (
    <>
      <div className="fixed w-100" style={{ height: '5px' }}>
        <ProgressBar pendingNum={pending} completed={completed} red />
      </div>
      {ele}
    </>
  );
}
