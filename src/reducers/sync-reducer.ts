import {State} from "../state";
import {
  abortRequest, AjaxConfig, CompleteRequest, parseResponseHeaders, requestAjax,
  RequestAjax
} from "kamo-reducers/services/ajax";
import {IgnoredAction, ReductionWithEffect, SideEffect} from "kamo-reducers/reducers";
import {AuthSuccess} from "../services/login";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {Indexer} from "redux-indexers";
import {clozesIndexer, notesIndexer, termsIndexer} from "../indexes";
import {
  Note, denormalizedNote, normalizedNote, parseNote, stringifyNote, NormalizedNote,
  newNormalizedNote
} from "../model";
import {LoadNextIndexesBatch, requestLocalStoreUpdate} from "./local-store-reducer";

export type DropboxAction = AuthSuccess | CompleteRequest | LoadNextIndexesBatch;

export function reduceSync(state: State, action: DropboxAction | IgnoredAction): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  switch (action.type) {
    case "complete-request":
      state = {...state};
      state.now = action.when;

      if (syncFileRequestNames.indexOf(action.name[0]) === -1) {
        break;
      }

      if (!action.success) {
        state.syncOffline = true;
        ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));
        break;
      }

      if (action.name[0] === filesUploadRequestName) {
        let idx = state.remainingUploads.indexOf(action.name);
        if (idx !== -1) {
          state.remainingUploads = state.remainingUploads.slice();
          state.remainingUploads.splice(idx, 1);
        }

        ({state, effect} = sequenceReduction(effect, checkUploadSyncComplete(state)));
      }

      if (action.name[0] === listFolderRequestName) {
        let response = JSON.parse(action.response) as DropboxListFolderResponse;
        ({state, effect} = sequenceReduction(effect, startSyncDownload(state, response)));
        ({state, effect} = sequenceReduction(effect, checkSyncDownloadComplete(state)));
      }

      if (action.name[0] === filesDownloadRequestName) {
        let downloadedNote: NormalizedNote;
        try {
          downloadedNote = parseNote(action.response);
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            downloadedNote = {...newNormalizedNote};
            downloadedNote.attributes = {...downloadedNote.attributes};
            downloadedNote.attributes.content = action.response;
          } else {
            throw e;
          }
        }

        let response = JSON.parse(parseResponseHeaders(action.headers)["Dropbox-API-Result"]) as DropboxDownloadResponse;

        let denormalized = denormalizedNote(downloadedNote, response.id, response.rev, response.path_lower);
        state.downloadedNotes = state.downloadedNotes.concat([denormalized]);

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

export function dropboxHeadersWithArgs(accessToken: string, args: { [k: string]: object | string | number }): AjaxConfig["headers"] {
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

export function requestFileDownload(accessToken: string, rev: string) {
  let config: AjaxConfig = {
    url: "https://content.dropboxapi.com/2/files/download",
    method: "GET",
    headers: dropboxHeadersWithArgs(accessToken, {
      path: "rev:" + rev
    }),
    overrideMimeType: "text/plain; charset=UTF-8"
  };

  return requestAjax([filesDownloadRequestName, accessToken, rev], config);
}

// TODO: FIXME???  UPLOAD BY ID??
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

function removeNote(indexes: State["indexes"], note: Note) {
  indexes.notes = notesIndexer.removeAll(indexes.notes, [note]);

  let terms = Indexer.getAllMatching(indexes.terms.byNoteIdReferenceAndMarker, [note.id]);
  indexes.terms = termsIndexer.removeAll(indexes.terms, terms);

  for (let term of terms) {
    let clozes = Indexer.getAllMatching(
      indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx,
      [note.id, term.attributes.reference, term.attributes.marker]);

    indexes.clozes = clozesIndexer.removeAll(indexes.clozes, clozes);
  }
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

  state.indexes = {...state.indexes};
  state.syncingListFolder.entries.forEach(entry => {
    if (entry[".tag"] === "deleted") {
      let notes = Indexer.getAllMatching(state.indexes.notes.byPath, entry.path_lower.split("/"));

      for (let note of notes) {
        removeNote(state.indexes, note);
      }
    } else if (entry[".tag"] === "file") {
      let file = entry as DropboxFileEntry;
      for (var downloaded of state.downloadedNotes) {
        if (downloaded.note.id === file.id) break;
      }

      let existing = Indexer.getFirstMatching(state.indexes.notes.byId, [downloaded.note.id]);
      if (existing) return;

      if (existing) {
        removeNote(state.indexes, existing);
      }

      state.indexes.notes = notesIndexer.update(state.indexes.notes, [downloaded.note]);
      state.indexes.terms = termsIndexer.update(state.indexes.terms, downloaded.terms);
      state.indexes.clozes = clozesIndexer.update(state.indexes.clozes, downloaded.clozes);
    }
  });

  state.settings = {...state.settings};
  state.settings.session = {...state.settings.session};
  state.settings.session.syncCursor = state.syncingListFolder.cursor;
  effect = sequence(effect, requestLocalStoreUpdate(state));

  if (state.syncingListFolder.has_more) {
    effect = sequence(effect, requestListFolder(state.settings.session.accessToken, state.syncingListFolder.cursor));
  }

  return {state, effect};
}


function checkUploadSyncComplete(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  if (state.remainingUploads.length) return {state, effect};

  state = {...state};

  let listFolderRequest = requestListFolder(state.settings.session.accessToken, state.settings.session.syncCursor);
  state.clearSyncEffects = state.clearSyncEffects.concat([abortRequest(listFolderRequest.name)]);
  effect = sequence(effect, listFolderRequest);

  return {state, effect};
}

export function clearOtherSyncProcesses(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  state = {...state};

  for (let nextEffect of state.clearSyncEffects) {
    effect = sequence(effect, nextEffect);
  }

  state.clearSyncEffects = [];

  return {state, effect};
}

function startSyncDownload(state: State, response: DropboxListFolderResponse): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  if (!state.settings.session.accessToken || (state.now / 1000) > state.settings.session.sessionExpiresAt) {
    state.syncAuthBad = true;
    return {state, effect};
  }

  let token = state.settings.session.accessToken;

  state.syncingListFolder = response;
  state.downloadedNotes = [];
  state.executingDownloads = [];
  state.clearSyncEffects = state.clearSyncEffects.slice();


  for (let entry of response.entries) {
    if (entry[".tag"] === "file") {
      let request = requestFileDownload(token, (entry as DropboxFileEntry).rev);
      state.clearSyncEffects.push(abortRequest(request.name));
      effect = sequence(effect, request);
      state.executingDownloads.push(request.name);
    }
  }

  return {state, effect};
}

function startSyncUpload(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | 0 = null;

  let hasEdits = Indexer.getAllMatching(state.indexes.notes.byHasLocalEdits, [true]);
  state.clearSyncEffects = state.clearSyncEffects.slice();
  state.remainingUploads = [];

  for (let note of hasEdits) {
    let terms = Indexer.getAllMatching(state.indexes.terms.byNoteIdReferenceAndMarker, [note.id]);
    let clozes = Indexer.getAllMatching(state.indexes.clozes.byNoteIdReferenceMarkerAndClozeIdx, [note.id]);
    let normalized = normalizedNote(note, terms, clozes);

    let request = requestFileUpload(state.settings.session.accessToken, normalized, note.path, note.version);
    state.clearSyncEffects.push(abortRequest(request.name));
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
  state.syncOffline = false;
  state.syncAuthBad = false;

  if (!state.settings.session.accessToken || (state.now / 1000) > state.settings.session.sessionExpiresAt) {
    state.syncAuthBad = true;
    return {state, effect};
  }

  ({state, effect} = sequenceReduction(effect, startSyncUpload(state)));
  ({state, effect} = sequenceReduction(effect, checkUploadSyncComplete(state)));

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
