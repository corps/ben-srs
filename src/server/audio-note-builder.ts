import {Language, newNormalizedNote, stringifyNote} from "../model";
import {
  fileUploadAjaxConfig,
  getDropboxResult,
  DropboxUploadResponse,
} from "../services/dropbox";
import {executeAjaxConfig} from "./execute-ajax-config";
import uuid = require("uuid");

export function uploadNewAudioNote(
  audio: Buffer,
  ext: string,
  content: string,
  language: Language,
  accessToken: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    let config = fileUploadAjaxConfig(
      accessToken,
      "/" + uuid.v4() + "." + ext,
      "",
      audio as any
    );

    executeAjaxConfig(config, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const dropboxResult = getDropboxResult(result);
      const uploadResponse = dropboxResult.response as DropboxUploadResponse;
      let note = {...newNormalizedNote};

      note.attributes = {...newNormalizedNote.attributes};
      note.attributes.audioFileId = uploadResponse.id;
      note.attributes.content = content;
      note.attributes.language = language;

      let config = fileUploadAjaxConfig(
        accessToken,
        "/" + uuid.v4() + ".txt",
        "",
        stringifyNote(note)
      );

      executeAjaxConfig(config, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(null);
      });
    });
  });
}

// uploadNewAudioNote(
//   fs.readFileSync(
//     "/Users/zachcollins/Dropbox/Public/glossika/JAYUE-F3-GMS/JAYUE-F3-GMS-C-2001_silence_01.mp3"
//   ),
//   "mp3",
//   "Some test content",
//   "English",
//   "rStw6ZI7n6sAAAAAAAAOzHwlNAiCJR2a1Z0lbLqZAutTh1ZJmMCfZ5OPz6hNaseE"
// ).then(() => {

//    console.log("done");
// }, (e) => {
//   console.log("Failed", e);
// });
