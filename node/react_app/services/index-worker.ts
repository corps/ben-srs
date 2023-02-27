import {
  expandedNote,
  indexesInitialState,
  parseNote,
  updateNotes
} from '../notes';
import { normalizeBlob, readText } from './storage';
import { createFileStore } from './services';

const store = createFileStore();
const worker = self;
worker.onmessage = async () => {
  try {
    const indexes = { ...indexesInitialState };
    const noteBlobs = await store.fetchBlobsByExt('txt');
    const trees = await Promise.all(
      noteBlobs.map(async ({ blob, id, rev, path }) => {
        const contents = await readText(normalizeBlob(blob));
        const normalized = parseNote(contents);
        return expandedNote(normalized, id, path, rev);
      })
    );
    updateNotes(indexes, ...trees);

    // @ts-ignore
    worker.postMessage({
      indexes
    });
  } catch (e) {
    console.error(e);
  }
};
