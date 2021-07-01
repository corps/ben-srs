import {SideEffect} from "kamo-reducers/reducers";
import {Language} from "../storage";
import {requestSpeech} from "./speech";
import {playAudioFile} from "./files";
import {State} from "../state";
import {Indexer} from "redux-indexers";

export function requestTermSpeech(
  state: State,
  audioFileId: string | void,
  language: Language,
  segment: string
): SideEffect {
  if (audioFileId) {
    let sf = Indexer.getFirstMatching(state.indexes.storedFiles.byId, [
      audioFileId,
    ]);
    if (sf) {
      let extParts = sf.name.split(".");
      let ext = extParts[extParts.length - 1];

      return playAudioFile(sf.id + "-" + sf.revision + "." + ext);
    }
  }

  return requestSpeech(segment, language);
}
