import 'regenerator-runtime';
import { makeContextual } from './makeContextual';
import { useState } from 'react';
import { FileStore } from '../services/storage';
import { createFileStore } from '../services/services';

export const [useFileStorage, FileStorageContext] = makeContextual<FileStore>(
  function useFileStorage() {
    return useState(createFileStore)[0];
  }
);
