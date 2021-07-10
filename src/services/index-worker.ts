import {defaultNoteTree, denormalizedNote, indexesInitialState, normalizedNote, parseNote, updateNotes} from "../notes";
import {FileStore, StoredBlob} from "./storage";
import {createDexie} from "./dexie";

const store = new FileStore(createDexie());
const worker = self;
worker.onmessage = async () => {
  try {
    const indexes = {...indexesInitialState};
    const noteBlobs = await store.fetchBlobsByExt('txt');
    console.log('blobs?', noteBlobs.length);
    const trees = await Promise.all(noteBlobs.map(async ({blob, id, rev, path}) => {
      // try {
      // const contents = await blob.text();
      // const normalized = parseNote(contents);
      // return denormalizedNote(normalized, id, path, rev);
      // } catch (e) {
      //     console.error('failed to load....', e);
      //     throw e;
          return defaultNoteTree;
      // }
    }))
    updateNotes(indexes, ...trees);

    console.log('posting back...', indexes)
    // @ts-ignore
    worker.postMessage({
      indexes,
    });
  } catch (e) {
    console.error(e);
  }
};
