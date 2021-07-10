import {defaultNoteTree, denormalizedNote, indexesInitialState, normalizedNote, parseNote, updateNotes} from "../notes";
import {FileStore, readText, StoredBlob} from "./storage";
import {createDexie} from "./dexie";

const store = new FileStore(createDexie());
const worker = self;
worker.onmessage = async () => {
  try {
    const indexes = {...indexesInitialState};
    const noteBlobs = await store.fetchBlobsByExt('txt');
    const trees = await Promise.all(noteBlobs.map(async ({blob, id, rev, path}) => {
      const contents = await readText(blob);
      const normalized = parseNote(contents);
      return denormalizedNote(normalized, id, path, rev);
    }))
    updateNotes(indexes, ...trees);

    // @ts-ignore
    worker.postMessage({
      indexes,
    });
  } catch (e) {
    console.error(e);
  }
};