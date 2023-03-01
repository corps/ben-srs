import { makeContextual } from './makeContextual';
import { useState } from 'react';
import { some } from '../../shared/maybe';

export const defaultStudyContext = {
  tag: '',
  audioStudy: false,
  target: some(30)
};

export const [useStudyContext, StudyContext] = makeContextual(
  function useStudyContext() {
    return useState(defaultStudyContext);
  }
);
