import {defaultNoteTree, denormalizedNote, indexesInitialState, normalizedNote, parseNote, updateNotes} from "../notes";
import {StoredBlob} from "./storage";

const worker = self;
worker.onmessage = ({ data: { noteBlobs } }: { data: { noteBlobs: StoredBlob[] }}) => {
    const indexes = {...indexesInitialState};
    Promise.all(noteBlobs.map(async ({blob, id, rev, path}) => {
        try {
          const contents = await blob.text();
          const normalized = parseNote(contents);
          return denormalizedNote(normalized, id, path, rev);
        } catch (e) {
            // console.error({blob});
            return defaultNoteTree;
        }
    })).then(trees => {
        updateNotes(indexes, ...trees);

        console.log('posting back...')
        // @ts-ignore
        worker.postMessage({
            indexes,
        });
    });
};
