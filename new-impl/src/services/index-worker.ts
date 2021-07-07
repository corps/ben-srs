import {defaultNoteTree, denormalizedNote, indexesInitialState, normalizedNote, parseNote, updateNotes} from "../notes";
import {StoredBlob} from "./storage";

const worker = self;
worker.onmessage = ({ data: { noteBlobs } }: { data: { noteBlobs: StoredBlob[] }}) => {
  console.log('recv');
    const indexes = {...indexesInitialState};
    if (!noteBlobs[0]) return;
    Promise.all(noteBlobs.map(async ({blob, id, rev, path}) => {
        try {
            // console.log(blob.text);
            // const contents = await blob.text();
            // const normalized = parseNote(contents);
            // return denormalizedNote(normalized, id, path, rev);
          return defaultNoteTree;
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
