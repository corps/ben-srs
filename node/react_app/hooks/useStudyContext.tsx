import { makeContextual } from './makeContextual';
import { useMemo, useState } from 'react';
import { some } from '../../shared/maybe';
import { useNotesIndex } from './useNotesIndex';
import { Indexer } from '../../shared/indexable';
import { useStoredState } from './useStoredState';
import { getLanguagesOfNotes } from '../services/indexes';

export const [useStudyContext, StudyContext] = makeContextual(
  function useStudyContext() {
    const [selectedLanguage, setLanguage] = useStoredState(
      localStorage,
      'lastLanguage',
      ''
    );
    const languages = useLanguages();
    const language = languages.includes(selectedLanguage)
      ? selectedLanguage
      : '';
    const allTags = useAllTags(language);
    let [tag, setTag] = useState('');
    if (!allTags.includes(tag)) tag = language;
    const [audioStudy, setAudioStudy] = useState(false);
    const [target, setTarget] = useState(some(30));

    return {
      target,
      setTarget,
      audioStudy,
      setAudioStudy,
      allTags,
      tag,
      setTag,
      language,
      languages,
      setLanguage
    };
  }
);

function useLanguages() {
  const [notesIndex] = useNotesIndex();
  return useMemo(() => {
    return getLanguagesOfNotes(notesIndex.notes);
  }, [notesIndex.notes]);
}

function useAllTags(language: string) {
  const [notesIndex] = useNotesIndex();
  return useMemo(
    () =>
      Indexer.getAllMatching(notesIndex.taggedNotes.byLangAndTagOfFirstNoteId, [
        language
      ]).map(({ tag }) => tag),
    [language, notesIndex.taggedNotes.byLangAndTagOfFirstNoteId]
  );
}
