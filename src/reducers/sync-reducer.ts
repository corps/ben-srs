import {State} from "../state";
import {
  abortRequest,
  CompleteRequest,
  requestAjax,
  RequestAjax,
} from "kamo-reducers/services/ajax";
import {
  IgnoredAction,
  ReductionWithEffect,
  SideEffect,
} from "kamo-reducers/reducers";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {Indexer} from "redux-indexers";
import {
  denormalizedNote,
  findNoteTree,
  loadIndexables,
  normalizedNote,
  notesIndexer,
  storedFilesIndexer,
  NoteTree,
  removeNote,
} from "../indexes";
import {
  parseNote,
  stringifyNote,
  NormalizedNote,
  newNormalizedNote,
} from "../model";
import {requestLocalStoreUpdate} from "./session-reducer";
import {getDropboxResult, getMimeFromFileName} from "../services/dropbox";
import {DropboxListFolderResponse} from "../services/dropbox";
import {DropboxDownloadResponse} from "../services/dropbox";
import {DropboxFileEntry} from "../services/dropbox";
import {listFolderAjaxConfig} from "../services/dropbox";
import {fileDownloadAjaxConfig} from "../services/dropbox";
import {fileUploadAjaxConfig} from "../services/dropbox";
import {continueFileSync} from "./file-sync-reducer";

export const listFolderRequestName = "list-folder";
export const noteDownloadRequestName = "notes-download";
export const noteUploadRequestName = "notes-upload";
export const syncRequestNames = [
  listFolderRequestName,
  noteDownloadRequestName,
  noteUploadRequestName,
];

export function requestListFolder(
  accessToken: string,
  cursor = ""
): RequestAjax {
  return requestAjax(
    [listFolderRequestName],
    listFolderAjaxConfig(accessToken, cursor)
  );
}

export function requestFileDownload(
  accessToken: string,
  pathOrId: string
): RequestAjax {
  return requestAjax(
    [noteDownloadRequestName, pathOrId],
    fileDownloadAjaxConfig(accessToken, pathOrId)
  );
}

export function requestFileUpload(
  accessToken: string,
  pathOrId: string,
  version: string | void,
  body: string
): RequestAjax {
  return requestAjax(
    [noteUploadRequestName, pathOrId],
    fileUploadAjaxConfig(accessToken, pathOrId, version, body)
  );
}

function reduceSyncRequestFailure(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void;

  state = {...state};
  state.syncOffline = true;
  ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));

  return {state, effect};
}

function completeListFolder(
  state: State,
  completeRequest: CompleteRequest
): ReductionWithEffect<State> {
  if (completeRequest.name[0] !== listFolderRequestName) return {state};

  if (!completeRequest.success) {
    return reduceSyncRequestFailure(state);
  }

  let effect: SideEffect | void;
  let response = getDropboxResult(completeRequest)
    .response as DropboxListFolderResponse;

  if (response) {
    state = {...state};
    state.syncingListFolder = response;
    state.awaitingDownloadNotes = getUnfulfilledDownloads(state, response);
  }

  return {state, effect};
}

function completeFileUpload(
  state: State,
  completeRequest: CompleteRequest
): ReductionWithEffect<State> {
  if (completeRequest.name[0] !== noteUploadRequestName) return {state};

  const pathOrId = completeRequest.name[1];
  const conflict = completeRequest.status === 409;
  if (!completeRequest.success && !conflict) {
    return reduceSyncRequestFailure(state);
  }

  let effect: SideEffect | void;

  state = {...state};
  if (pathOrId.slice(0, 3) === "id:") {
    let note = Indexer.getFirstMatching(state.indexes.notes.byId, [pathOrId]);
    if (note) {
      note = {...note};
      note.localEdits = false;

      if (conflict) {
        note.hasConflicts = true;
      }

      state.indexes = {...state.indexes};
      state.indexes.notes = notesIndexer.update(state.indexes.notes, [note]);
    }
  } else {
    state.newNotes = {...state.newNotes};
    delete state.newNotes[pathOrId];
  }

  return {state, effect};
}

function completeFileDownload(
  state: State,
  completeRequest: CompleteRequest
): ReductionWithEffect<State> {
  if (completeRequest.name[0] !== noteDownloadRequestName) return {state};

  const missingFile = completeRequest.status === 409;
  if (!completeRequest.success && !missingFile) {
    return reduceSyncRequestFailure(state);
  }

  let effect: SideEffect | void;

  state = {...state};

  if (completeRequest.success && state.syncingListFolder) {
    const dropboxResult = getDropboxResult(completeRequest);
    let downloadedNote: NormalizedNote;
    try {
      downloadedNote = parseNote((dropboxResult.content as string) || "");
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        downloadedNote = {...newNormalizedNote};
        downloadedNote.attributes = {...downloadedNote.attributes};
        downloadedNote.attributes.content = (dropboxResult.content as string) || "";
      } else {
        throw e;
      }
    }

    const downloadResponse: DropboxDownloadResponse = dropboxResult.response;

    let denormalized = denormalizedNote(
      downloadedNote,
      downloadResponse.id,
      downloadResponse.path_lower,
      downloadResponse.rev
    );

    state.downloadedNotes = state.downloadedNotes.concat([denormalized]);
    let idx = state.awaitingDownloadNotes.indexOf(completeRequest.name[1]);

    if (idx !== -1) {
      state.awaitingDownloadNotes = state.awaitingDownloadNotes.slice();
      state.awaitingDownloadNotes.splice(idx, 1);
    } else {
      throw new Error(
        "Got response for download " +
          completeRequest.name[1] +
          " but it was not in awaitingDownloadNotes."
      );
    }
  }

  return {state, effect};
}

export function reduceSync(
  state: State,
  action: CompleteRequest | IgnoredAction
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "complete-request":
      if (syncRequestNames.indexOf(action.name[0]) === -1) break;

      state = {...state};
      state.now = action.when;

      ({state, effect} = sequenceReduction(
        effect,
        completeFileUpload(state, action)
      ));

      ({state, effect} = sequenceReduction(
        effect,
        completeListFolder(state, action)
      ));

      ({state, effect} = sequenceReduction(
        effect,
        completeFileDownload(state, action)
      ));

      if (state.syncingListFolder) {
        ({state, effect} = sequenceReduction(
          effect,
          checkSyncDownloadComplete(state, state.syncingListFolder)
        ));
      }

      effect = sequence(effect, requestLocalStoreUpdate(state));
      ({state, effect} = sequenceReduction(effect, continueSync(state)));
      break;
  }

  return {state, effect};
}

function checkSyncDownloadComplete(
  state: State,
  listFolderResponse: DropboxListFolderResponse
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  if (state.settings.session.syncCursor == listFolderResponse.cursor) {
    state = {...state};
    state.awaitingDownloadNotes = [];
    state.downloadedNotes = [];
    return {state, effect};
  }

  if (state.awaitingDownloadNotes.length) return {state, effect};

  state = {...state};

  const downloadedNotesById: {[id: string]: NoteTree} = {};
  for (let tree of state.downloadedNotes) {
    downloadedNotesById[tree.note.id] = tree;
  }

  function loadDownloaded(id: string) {
    let downloaded = downloadedNotesById[id];
    let existing = Indexer.getFirstMatching(state.indexes.notes.byId, [id]);

    if (existing) {
      state.indexes = removeNote(state.indexes, existing);
    }

    if (downloaded) {
      state.indexes = loadIndexables(state.indexes, [downloaded]);
    }
  }

  let hasConflicts = Indexer.getAllMatching(
    state.indexes.notes.byHasConflicts,
    [true]
  );

  hasConflicts.forEach(note => {
    loadDownloaded(note.id);
  });

  listFolderResponse.entries.forEach(entry => {
    if (entry[".tag"] === "deleted") {
      let notes = Indexer.getAllMatching(
        state.indexes.notes.byPath,
        entry.path_lower.split("/")
      );

      for (let note of notes) {
        state.indexes = removeNote(state.indexes, note);
      }
    } else if (entry[".tag"] === "file") {
      let file = entry as DropboxFileEntry;

      if (isFileStoredEntry(file)) {
        state.indexes = {...state.indexes};
        state.indexes.storedFiles = storedFilesIndexer.update(
          state.indexes.storedFiles,
          [
            {
              id: file.id,
              revision: file.rev,
              name: file.name,
              size: file.size,
            },
          ]
        );
      } else {
        loadDownloaded(file.id);
      }
    }
  });

  state.settings = {...state.settings};
  state.settings.session = {...state.settings.session};
  state.settings.session.syncCursor = listFolderResponse.cursor;
  state.downloadedNotes = [];

  return {state, effect};
}

export function clearOtherSyncProcesses(
  state: State
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  state = {...state};

  effect = sequence(effect, state.clearSyncEffects);
  state.clearSyncEffects = null;
  state.awaiting = {...state.awaiting};
  state.awaiting["sync"] = 0;

  return {state, effect};
}

export function startSync(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  if (!state.authReady || !state.indexesReady) {
    return {state, effect};
  }

  ({state, effect} = sequenceReduction(effect, clearOtherSyncProcesses(state)));

  state = {...state};
  state.startedSyncCount += 1;
  state.syncOffline = false;
  state.syncAuthBad = false;
  state.syncingListFolder = null;

  if (
    !state.settings.session.accessToken ||
    state.now / 1000 > state.settings.session.sessionExpiresAt
  ) {
    state.syncAuthBad = true;
    state.finishedSyncCount += 1;
    return {state, effect};
  }

  ({state, effect} = sequenceReduction(effect, continueSync(state)));

  return {state, effect};
}

function getUnfulfilledDownloads(
  state: State,
  listFolderResponse: DropboxListFolderResponse
): string[] {
  var result: string[] = [];

  const notesByIdAndRev: {[id: string]: {[rev: string]: NoteTree}} = {};

  for (let downloaded of state.downloadedNotes) {
    let byRev = (notesByIdAndRev[downloaded.note.id] =
      notesByIdAndRev[downloaded.note.id] || {});
    byRev[downloaded.note.version] = downloaded;
  }

  let conflictingIter = Indexer.iterator(
    state.indexes.notes.byHasConflicts,
    [true],
    [true, Infinity]
  );

  for (
    let conflictingNote = conflictingIter();
    conflictingNote;
    conflictingNote = conflictingIter()
  ) {
    if (notesByIdAndRev[conflictingNote.id]) continue;

    result.push(conflictingNote.id);
  }

  for (let entry of listFolderResponse.entries) {
    if (entry[".tag"] === "file") {
      let fileEntry = entry as DropboxFileEntry;
      let rev = fileEntry.rev;
      let id = fileEntry.id;

      if (isFileStoredEntry(fileEntry)) continue;
      if (notesByIdAndRev[id] && notesByIdAndRev[id][rev]) continue;

      result.push("rev:" + rev);
    }
  }

  return result;
}

export function isFileStoredEntry(entry: DropboxFileEntry) {
  let mime = getMimeFromFileName(entry.name);
  return mime && mime.split("/")[0] === "audio";
}

function continueSync(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  if (state.syncOffline) return {state, effect};

  if (!state.indexesReady) {
    // The clearSyncEffects may be missing a sync related side effect?
    throw new Error("continueSync was called while indexesReady was false!");
  }

  if (!state.authReady) {
    // The clearSyncEffects may be missing a sync related side effect?
    throw new Error("continueSync was called while indexesReady was false!");
  }

  state = {...state};

  if (
    !state.settings.session.accessToken ||
    state.now / 1000 > state.settings.session.sessionExpiresAt
  ) {
    state.syncAuthBad = true;
    state.finishedSyncCount += 1;
    return {state, effect};
  }

  let nextRequest: RequestAjax | void = null;

  if (state.syncingListFolder) {
    if (state.awaitingDownloadNotes.length) {
      nextRequest = requestFileDownload(
        state.settings.session.accessToken,
        state.awaitingDownloadNotes[0]
      );
    }

    state.awaiting = {...state.awaiting};
    state.awaiting["sync"] = state.awaitingDownloadNotes.length;
  } else {
    let localEditsNote = Indexer.getFirstMatching(
      state.indexes.notes.byHasLocalEdits,
      [true]
    );
    let hasLocalEditsRange = Indexer.getRangeFrom(
      state.indexes.notes.byHasLocalEdits,
      [true]
    );
    let newNoteKeys = Object.keys(state.newNotes);

    if (localEditsNote) {
      let noteTree = findNoteTree(state.indexes, localEditsNote.id);
      if (noteTree) {
        let normalized = normalizedNote(noteTree);
        nextRequest = requestFileUpload(
          state.settings.session.accessToken,
          localEditsNote.id,
          localEditsNote.version,
          stringifyNote(normalized)
        );
      }
    } else if (newNoteKeys.length) {
      const nextPath = newNoteKeys[0];

      let normalized = state.newNotes[nextPath];
      nextRequest = requestFileUpload(
        state.settings.session.accessToken,
        nextPath,
        "",
        stringifyNote(normalized)
      );
    }

    state.awaiting = {...state.awaiting};
    state.awaiting["sync"] =
      hasLocalEditsRange.endIdx -
      hasLocalEditsRange.startIdx +
      newNoteKeys.length;
  }

  if (!state.syncingListFolder || state.syncingListFolder.has_more) {
    if (!nextRequest) {
      nextRequest = requestListFolder(
        state.settings.session.accessToken,
        state.settings.session.syncCursor
      );

      state.awaiting = {...state.awaiting};
      state.awaiting["sync"] = 1;
    }
  }

  if (nextRequest) {
    state.clearSyncEffects = abortRequest(nextRequest.name);
    effect = sequence(effect, nextRequest);
  } else {
    state.awaiting = {...state.awaiting};
    state.awaiting["sync"] = 0;
    state.finishedSyncCount += 1;

    ({state, effect} = sequenceReduction(effect, continueFileSync(state)));
  }

  return {state, effect};
}
