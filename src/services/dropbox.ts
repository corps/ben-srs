import {
  AjaxConfig,
  CompleteRequest,
  parseResponseHeaders,
} from "kamo-reducers/services/ajax";

export interface DropboxRequestResult {
  content?: AjaxConfig["body"];
  response?: any | void;
}

export interface DropboxListFolderResponse {
  cursor: string;
  has_more: boolean;
  entries: (DropboxDeleteEntry | DropboxFileEntry | DropboxFolderEntry)[];
}

export interface DropboxDownloadResponse {
  id: string;
  rev: string;
  path_lower: string;
  size: number;
}

export interface DropboxUploadResponse {
  name: string;
  id: string;
  rev: string;
  path_lower: string;
  size: number;
}

export interface DropboxFileEntry {
  ".tag": "file";
  name: string;
  id: string;
  path_lower: string;
  rev: string;
  size: number;
}

export interface DropboxFolderEntry {
  ".tag": "folder";
  name: string;
  id: string;
  path_lower: string;
}

export interface DropboxDeleteEntry {
  ".tag": "deleted";
  path_lower: string;
}

export function dropboxBaseHeaders(accessToken: string): AjaxConfig["headers"] {
  return {
    Authorization: "Bearer " + accessToken,
  };
}

export function dropboxHeadersWithArgs(
  accessToken: string,
  args: any
): AjaxConfig["headers"] {
  return {
    ...dropboxBaseHeaders(accessToken),
    "Dropbox-API-Arg": JSON.stringify(args),
  };
}

export function dropboxApiHeaders(accessToken: string): AjaxConfig["headers"] {
  return {
    ...dropboxBaseHeaders(accessToken),
    "Content-Type": "application/json",
  };
}

export function dropboxApiRequestConfig(
  accessToken: string,
  path: string,
  args: any = undefined
): AjaxConfig {
  let config: AjaxConfig = {
    url: "https://api.dropboxapi.com/2/" + path,
    method: "POST",
    headers: dropboxApiHeaders(accessToken),
  };

  if (args !== undefined) {
    config.json = args;
  } else {
    delete config.headers['Content-Type'];
  }

  return config;
}

export function dropboxContentRequestConfig(
  accessToken: string,
  method: "GET" | "POST",
  path: string,
  args: any
): AjaxConfig {
  return {
    url: "https://content.dropboxapi.com/2/" + path,
    method: method,
    headers: dropboxHeadersWithArgs(accessToken, args),
  };
}

export function listFolderAjaxConfig(
  accessToken: string,
  cursor = ""
): AjaxConfig {
  var config = dropboxApiRequestConfig(
    accessToken,
    "files/list_folder",
    cursor
      ? {cursor}
      : {
          recursive: true,
          include_deleted: true,
          path: "",
        }
  );

  if (cursor) config.url += "/continue";
  return config;
}

export function fileDownloadAjaxConfig(
  accessToken: string,
  pathOrId: string,
  mimeType = "text/plain; charset=UTF-8",
  responseType = undefined as AjaxConfig["responseType"]
): AjaxConfig {
  var config = dropboxContentRequestConfig(
    accessToken,
    "GET",
    "files/download",
    {
      path: pathOrId,
    }
  );

  if (responseType) config.responseType = responseType;
  config.overrideMimeType = mimeType;

  return config;
}

export function fileUploadAjaxConfig(
  accessToken: string,
  pathOrId: string,
  version: string | void,
  body: string | Blob
): AjaxConfig {
  var config = dropboxContentRequestConfig(
    accessToken,
    "POST",
    "files/upload",
    {
      path: pathOrId,
      mode: version
        ? {
            ".tag": "update",
            update: version,
          }
        : "add",
    }
  );

  config.body = body;
  config.headers["Content-Type"] = "application/octet-stream";

  return config;
}

export function getDropboxResult(
  action: CompleteRequest
): DropboxRequestResult {
  let result: DropboxRequestResult = {};

  let headers = parseResponseHeaders(action.headers);
  const headerApiResult = headers["dropbox-api-result"];
  if (headerApiResult) {
    result.response = JSON.parse(headerApiResult);
    result.content = action.response;
  } else if (action.response) {
    result.response = JSON.parse(action.response as string);
  }

  return result;
}

export function getMimeFromFileName(name: string): string | void {
  let parts = name.split(".");
  if (parts.length > 0) {
    let ext = parts[parts.length - 1];
    return contentTypes[ext.toLowerCase()];
  }

  return null;
}

export const contentTypes: {[k: string]: string} = {
  "mp3": "audio/mpeg",
  "ogg": "audio/ogg",
  "wav": "audio/wav",
  "opus": "audio/opus",
};
