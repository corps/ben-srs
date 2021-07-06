import {defaultNoteTree, denormalizedNote, normalizedNote, NotesIndex, parseNote} from "../notes";
import {StoredBlob} from "./storage";
import {recursivelyExtractData} from "../utils/indexable";

const worker = self;
worker.onmessage = ({ data: { noteBlobs } }: { data: { noteBlobs: StoredBlob[] }}) => {
    const index = new NotesIndex();
    Promise.all(noteBlobs.map(async ({blob, id, rev, path}) => {
        try {
            const contents = await blob.text();
            const normalized = parseNote(contents);
            return denormalizedNote(normalized, id, path, rev);
        } catch (e) {
            console.error(e);
            return defaultNoteTree;
        }
    })).then(trees => {
        index.addNotes(...trees);

        // @ts-ignore
        worker.postMessage({
            index: recursivelyExtractData(index)
        });
    });
};
