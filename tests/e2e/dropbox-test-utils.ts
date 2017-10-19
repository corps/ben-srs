import {executeXhrWithConfig} from "kamo-reducers/services/ajax";
import {dropboxApiRequestConfig} from "../../src/services/dropbox";
export const testPath = "/Test";

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
