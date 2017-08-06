import {State} from "../state";
import {
  abortRequest, AjaxConfig, CompleteRequest, parseResponseHeaders, requestAjax,
  RequestAjax
} from "kamo-reducers/services/ajax";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {Indexer} from "redux-indexers";
import {
  denormalizedNote, findNoteTree, loadIndexables, normalizedNote, notesIndexer, removeNote,
} from "../indexes";
import {parseNote, stringifyNote, NormalizedNote, newNormalizedNote} from "../model";
import {requestLocalStoreUpdate} from "./local-store-reducer";

export function reduceSync(state: State, action: CompleteRequest | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "complete-request":
      state = {...state};
      state.now = action.when;

      if (syncFileRequestNames.indexOf(action.name[0]) === -1) {
        break;
      }

      if (action.name[0] === filesUploadRequestName) {
        if (!action.success && action.status !== 409) {
          state.syncOffline = true;
          ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));
          break;
        }

        let idx = state.remainingUploads.indexOf(action.name);
        if (idx !== -1) {
          state.remainingUploads = state.remainingUploads.slice();
          state.remainingUploads.splice(idx, 1);
        }

        if (action.name[2].slice(0, 3) === "id:") {
          let note = Indexer.getFirstMatching(state.indexes.notes.byId, [action.name[2]]);
          if (note) {
            note = {...note};
            note.localEdits = false;

            if (action.status == 409) {
              note.hasConflicts = true;
            }

            state.indexes = {...state.indexes};
            state.indexes.notes = notesIndexer.update(state.indexes.notes, [note]);
          }
        }
        else {
          state.newNotes = {...state.newNotes};
          delete state.newNotes[action.name[2]];
        }

        effect = sequence(effect, requestLocalStoreUpdate(state));
        ({state, effect} = sequenceReduction(effect, checkUploadSyncComplete(state)));
      }

      if (action.name[0] === listFolderRequestName) {
        if (!action.success) {
          state.syncOffline = true;
          ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));
          break;
        }

        let response = JSON.parse(action.response) as DropboxListFolderResponse;
        ({state, effect} = sequenceReduction(effect, startSyncDownload(state, response)));
        ({state, effect} = sequenceReduction(effect, checkSyncDownloadComplete(state)));
      }

      if (action.name[0] === filesDownloadRequestName) {
        if (!action.success && action.status !== 409) {
          state.syncOffline = true;
          ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));
          break;
        }

        if (action.status === 409) {
          state.executingDownloads = state.executingDownloads.slice();
          state.executingDownloads.splice(state.executingDownloads.indexOf(action.name), 1);
        } else {
          let downloadedNote: NormalizedNote;
          try {
            downloadedNote = parseNote(action.response);
          } catch (e) {
            if (process.env.NODE_ENV === "production") {
              downloadedNote = {...newNormalizedNote};
              downloadedNote.attributes = {...downloadedNote.attributes};
              downloadedNote.attributes.content = action.response;
            }
            else {
              throw e;
            }
          }

          let headers = parseResponseHeaders(action.headers);
          let response = JSON.parse(headers["dropbox-api-result"]) as DropboxDownloadResponse;

          let denormalized = denormalizedNote(downloadedNote, response.id, response.path_lower, response.rev);
          state.downloadedNotes = state.downloadedNotes.concat([denormalized]);
        }

        ({state, effect} = sequenceReduction(effect, checkSyncDownloadComplete(state)));
      }
  }

  return {state, effect};
}

export const listFolderRequestName = "list-folder";
export const filesDownloadRequestName = "files-download";
export const filesUploadRequestName = "files-upload";
export const syncFileRequestNames = [listFolderRequestName, filesDownloadRequestName, filesUploadRequestName];

export function dropboxBaseHeaders(accessToken: string): AjaxConfig["headers"] {
  return {
    "Authorization": "Bearer " + accessToken
  }
}

export function dropboxHeadersWithArgs(accessToken: string,
                                       args: { [k: string]: object | string | number }): AjaxConfig["headers"] {
  return {
    ...dropboxBaseHeaders(accessToken),
    "Dropbox-API-Arg": JSON.stringify(args),
  }
}

export function dropboxApiHeaders(accessToken: string): AjaxConfig["headers"] {
  return {
    ...dropboxBaseHeaders(accessToken),
    "Content-Type": "application/json"
  }
}

export function requestListFolder(accessToken: string, cursor = ""): RequestAjax {
  let config: AjaxConfig = {
    url: "https://api.dropboxapi.com/2/files/list_folder",
    method: "POST",
    headers: dropboxApiHeaders(accessToken),
  };

  config.json = cursor ? {cursor} : {
    recursive: true,
    include_deleted: true
  };

  if (cursor) config.url += "/continue";

  return requestAjax([listFolderRequestName], config);
}

export function requestFileDownload(accessToken: string, path: string) {
  let config: AjaxConfig = {
    url: "https://content.dropboxapi.com/2/files/download",
    method: "GET",
    headers: dropboxHeadersWithArgs(accessToken, {
      path: path
    }),
    overrideMimeType: "text/plain; charset=UTF-8"
  };

  return requestAjax([filesDownloadRequestName, accessToken, path], config);
}

export function requestFileUpload(accessToken: string,
                                  note: NormalizedNote,
                                  path: string,
                                  version = "") {
  let config: AjaxConfig = {
    url: "https://content.dropboxapi.com/2/files/upload",
    method: "POST",
    headers: dropboxHeadersWithArgs(accessToken, {
      path: path,
      mode: version ? {
        ".tag": "update",
        "update": version
      } : "add"
    }),
    body: stringifyNote(note)
  };

  config.headers["Content-Type"] = "application/octet-stream";

  return requestAjax([filesUploadRequestName, accessToken, path], config);
}

function checkSyncDownloadComplete(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  if (state.downloadedNotes.length !== state.executingDownloads.length) {
    return {state, effect};
  }

  state = {...state};
  if (!state.syncingListFolder) {
    return {state, effect};
  }

  let downloadedNoteIds = state.downloadedNotes.map(n => n.note.id);

  state.indexes = {...state.indexes};

  function loadDownloaded(id: string) {
    let idx = downloadedNoteIds.indexOf(id);
    let existing = Indexer.getFirstMatching(state.indexes.notes.byId, [id]);

    if (idx === -1) {
      if (existing) {
        state.indexes = removeNote(state.indexes, existing);
      }
    } else {

      let downloaded = state.downloadedNotes[idx];

      if (existing) {
        if (existing.localEdits) return;
        state.indexes = removeNote(state.indexes, existing);
      }

      state.indexes = loadIndexables(state.indexes, [downloaded]);
    }
  }

  state.syncingListFolder.entries.forEach(entry => {
    if (entry[".tag"] === "deleted") {
      let notes = Indexer.getAllMatching(state.indexes.notes.byPath, entry.path_lower.split("/"));

      for (let note of notes) {
        state.indexes = removeNote(state.indexes, note);
      }
    }
    else if (entry[".tag"] === "file") {
      let file = entry as DropboxFileEntry;
      loadDownloaded(file.id);
    }
  });

  let hasConflicts = Indexer.getAllMatching(state.indexes.notes.byHasConflicts, [true]);
  hasConflicts.forEach(note => {
    loadDownloaded(note.id);
  });

  state.settings = {...state.settings};
  state.settings.session = {...state.settings.session};
  state.settings.session.syncCursor = state.syncingListFolder.cursor;
  effect = sequence(effect, requestLocalStoreUpdate(state));

  if (state.syncingListFolder.has_more) {
    effect = sequence(effect, requestListFolder(state.settings.session.accessToken, state.syncingListFolder.cursor));
  }

  state.finishedSyncCount += 1;

  return {state, effect};
}

function checkUploadSyncComplete(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  if (state.remainingUploads.length) return {state, effect};

  state = {...state};

  let listFolderRequest = requestListFolder(state.settings.session.accessToken, state.settings.session.syncCursor);
  state.clearSyncEffects = sequence(state.clearSyncEffects, abortRequest(listFolderRequest.name));
  effect = sequence(effect, listFolderRequest);

  return {state, effect};
}

export function clearOtherSyncProcesses(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state = {...state};

  effect = sequence(effect, state.clearSyncEffects);
  state.clearSyncEffects = null;

  return {state, effect};
}

function startSyncDownload(state: State, response: DropboxListFolderResponse): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state = {...state};

  if (!state.settings.session.accessToken || (state.now / 1000) > state.settings.session.sessionExpiresAt) {
    state.syncAuthBad = true;
    return {state, effect};
  }

  let token = state.settings.session.accessToken;

  state.syncingListFolder = response;
  state.downloadedNotes = [];
  state.executingDownloads = [];

  let hasConflicts = Indexer.getAllMatching(state.indexes.notes.byHasConflicts, [true]);
  for (let note of hasConflicts) {
    let request = requestFileDownload(token, note.id);
    state.clearSyncEffects = sequence(state.clearSyncEffects, abortRequest(request.name));
    effect = sequence(effect, request);
    state.executingDownloads.push(request.name);
  }

  for (let entry of response.entries) {
    if (entry[".tag"] === "file") {
      let request = requestFileDownload(token, "rev:" + (entry as DropboxFileEntry).rev);
      state.clearSyncEffects = sequence(state.clearSyncEffects, abortRequest(request.name));
      effect = sequence(effect, request);
      state.executingDownloads.push(request.name);
    }
  }

  return {state, effect};
}

function startSyncUpload(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state = {...state};

  let hasEdits = Indexer.getAllMatching(state.indexes.notes.byHasLocalEdits, [true]);
  state.remainingUploads = [];

  for (let note of hasEdits) {
    let noteTree = findNoteTree(state.indexes, note.id);
    if (!noteTree) continue;
    let normalized = normalizedNote(noteTree);

    let request = requestFileUpload(state.settings.session.accessToken, normalized, note.id, note.version);
    state.clearSyncEffects = sequence(state.clearSyncEffects, abortRequest(request.name));
    state.remainingUploads.push(request.name);
    effect = sequence(effect, request);
  }

  for (let key in state.newNotes) {
    let normalized = state.newNotes[key];
    let request = requestFileUpload(state.settings.session.accessToken, normalized, key, "");
    state.clearSyncEffects = sequence(state.clearSyncEffects, abortRequest(request.name));
    state.remainingUploads.push(request.name);
    effect = sequence(effect, request);
  }

  ({state, effect} = sequenceReduction(effect, checkUploadSyncComplete(state)));

  return {state, effect};
}

export function startSync(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  if (!state.authReady || !state.indexesReady) {
    return {state, effect};
  }

  ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));

  state = {...state};
  state.startedSyncCount += 1;
  state.syncOffline = false;
  state.syncAuthBad = false;

  if (!state.settings.session.accessToken || (state.now / 1000) > state.settings.session.sessionExpiresAt) {
    state.syncAuthBad = true;
    state.finishedSyncCount += 1;
    return {state, effect};
  }

  ({state, effect} = sequenceReduction(effect, startSyncUpload(state)));

  return {state, effect};
}

export interface DropboxListFolderResponse {
  cursor: string
  has_more: boolean
  entries: (DropboxDeleteEntry | DropboxFileEntry | DropboxFolderEntry)[]
}

export interface DropboxDownloadResponse {
  id: string
  rev: string
  path_lower: string
}

export interface DropboxFileEntry {
  ".tag": "file"
  name: string
  id: string
  path_lower: string
  rev: string
  size: number
}

export interface DropboxFolderEntry {
  ".tag": "folder"
  name: string
  id: string
  path_lower: string
}

export interface DropboxDeleteEntry {
  ".tag": "deleted"
  path_lower: string
}
