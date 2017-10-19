import {
  DropboxDeleteEntry,
  DropboxDownloadResponse,
  DropboxFileEntry,
  DropboxListFolderResponse,
} from "../../src/services/dropbox";

import {genSomeText} from "./general-factories";

export function genDropboxListFolderResponse(
  has_more = false
): DropboxListFolderResponse {
  return {
    cursor: genSomeText(),
    entries: [],
    has_more,
  };
}

export function genDeleteEntry(): DropboxDeleteEntry {
  return {
    ".tag": "deleted",
    path_lower: genSomeText(),
  };
}

export function genFileEntry(): DropboxFileEntry {
  let name = genSomeText();

  return {
    ".tag": "file",
    name,
    id: "id:" + genSomeText(),
    path_lower: genSomeText() + "/" + name,
    rev: genSomeText(),
    size: 100,
  };
}

export function genDownloadResponse(
  fileEntry: DropboxFileEntry
): DropboxDownloadResponse {
  let {id, rev, path_lower} = fileEntry;
  return {id, rev, path_lower};
}
