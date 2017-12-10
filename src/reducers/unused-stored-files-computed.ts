import {memoizeBySomeProperties} from "kamo-reducers/memoizers";
import {initialState} from "../state";
import {Indexer} from "redux-indexers";
import {StoredFile} from "../model";

export const computeUnusedStoredFiles = memoizeBySomeProperties(
  {
    indexes: initialState.indexes,
  },
  state => {
    let result = [] as StoredFile[];

    let storedFilesById = state.indexes.storedFiles.byId;
    let notesByAudioId = state.indexes.notes.byAudioFileId;

    let i = 0;
    let range = Indexer.getRangeFrom(notesByAudioId, [""], [Infinity]);
    let j = range.startIdx;

    while (i < storedFilesById.length) {
      if (
        j >= notesByAudioId.length ||
        storedFilesById[i][1].id < notesByAudioId[j][1].attributes.audioFileId
      ) {
        result.push(storedFilesById[i++][1]);
      } else if (
        storedFilesById[i][1].id > notesByAudioId[j][1].attributes.audioFileId
      ) {
        j++;
      } else {
        i++;
        j++;
      }
    }

    return result;
  }
);
