import {executeXhrWithConfig} from "kamo-reducers/services/ajax";
import {dropboxApiRequestConfig, fileUploadAjaxConfig} from "../../src/services/dropbox";
export const testPath = "/Test";

function dataURItoBlob(dataURI: string) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}

export const mp3One = dataURItoBlob(require("../factories/JAYUE-F1-1.mp3") as string);
export const mp3Two = dataURItoBlob(require("../factories/JAYUE-F1-2.mp3") as string);

function dropboxApi(
  token: string,
  path: string,
  args: any,
  cb: (err: any, data?: any) => void
) {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = false;

  xhr.onerror = cb;
  xhr.ontimeout = cb;

  xhr.onload = () => {
    cb(undefined, JSON.parse(xhr.responseText));
  };

  var config = dropboxApiRequestConfig(token, path, args);
  executeXhrWithConfig(config, xhr);
}

function createFolder(
  path: string,
  token: string,
  cb: (err: any, data?: any) => void
) {
  dropboxApi(token, "files/create_folder_v2", {path}, cb);
}

export function uploadFile(
  path: string,
  token: string,
  content: Blob,
  cb: (err: any, response?: any) => void
) {
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = false;

  xhr.onerror = cb;
  xhr.ontimeout = cb;

  xhr.onload = () => {
    cb(undefined, JSON.parse(xhr.responseText));
  };

  var config = fileUploadAjaxConfig(token, path, undefined, content);
  executeXhrWithConfig(config, xhr);
}

export function deletePath(
  path: string,
  token: string,
  cb: (err: any, data?: any) => void
) {
  dropboxApi(token, "files/delete_v2", {path}, cb);
}

function getLatestCursor(
  path: string,
  token: string,
  cb: (err: any, data?: any) => void
) {
  dropboxApi(
    token,
    "files/list_folder/get_latest_cursor",
    {path, recursive: true},
    cb
  );
}

export function setupDropbox(
  token: string,
  cb: (err: any, cursor: string) => void
) {
  deletePath(testPath, token, (err: any, data: any) => {
    createFolder(testPath, token, (err: any, data: any) => {
      getLatestCursor("", token, (err: any, data: any) => {
        if (err) {
          cb(err, undefined);
        } else {
          cb(undefined, data.cursor);
        }
      });
    });
  });
}
