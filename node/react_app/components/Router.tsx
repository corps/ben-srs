import React, { ReactElement, useEffect, useState } from 'react';
import { RouteContext, useStudyContext } from '../hooks/contexts';
import { MainMenu } from './MainMenu';
import { ProgressBar } from './ProgressBar';
import { useProgress } from '../hooks/useProgress';
import { useSync } from '../hooks/useSync';
import { Maybe, withDefault } from '../utils/maybe';
import { useQuery } from '../hooks/useQuery';
import { Search } from './Search';
import { EditNote } from './EditNote';
import { useUpdateNote } from '../hooks/useUpdateNote';
import { createId } from '../services/storage';
import { useWorkflowRouting } from '../hooks/useWorkflowRouting';

export function Router() {
  const [route, setRoute] = useState(null as Maybe<ReactElement>);
  const { pending, completed, onProgress } = useProgress();
  const [syncResult, syncError] = useSync(onProgress);
  const syncFailed = !!syncError;
  const [{ isSyncing, ...studyContext }, setStudyContext] = useStudyContext();

  useEffect(() => {
    syncError && console.error(syncError);
  }, [syncError]);

  useEffect(() => {
    if (!isSyncing) {
      if (!syncResult && !syncError) {
        setStudyContext({ ...studyContext, isSyncing: true });
      }
    } else {
      if (syncResult || syncError) {
        setStudyContext({ ...studyContext, isSyncing: false });
      }
    }
  }, [isSyncing, studyContext, setStudyContext, syncResult, syncError]);

  const ele = withDefault(route, <MainMenu syncFailed={syncFailed} />);
  const query = useQuery();

  const updateNote = useUpdateNote();
  const newNoteRouting = useWorkflowRouting(EditNote, MainMenu, updateNote);
  const searchRouting = useWorkflowRouting(Search, MainMenu);

  useState(() => {
    if (query.s) {
      searchRouting({ defaultSearch: query.s }, { syncFailed });
    } else if (query.c) {
      newNoteRouting(
        { noteId: createId(), newNoteContent: query.c },
        { syncFailed }
      );
    }
  });

  return (
    <RouteContext.Provider value={setRoute}>
      <div className="fixed w-100" style={{ height: '5px' }}>
        <ProgressBar pendingNum={pending} completed={completed} red />
      </div>
      {ele}
    </RouteContext.Provider>
  );
}
