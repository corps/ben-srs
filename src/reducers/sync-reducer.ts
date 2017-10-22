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
import {getDropboxResult} from "../services/dropbox";
import {filesUploadRequestName} from "../services/dropbox";
import {listFolderRequestName} from "../services/dropbox";
import {DropboxListFolderResponse} from "../services/dropbox";
import {filesDownloadRequestName} from "../services/dropbox";
import {DropboxDownloadResponse} from "../services/dropbox";
import {DropboxFileEntry} from "../services/dropbox";
import {listFolderAjaxConfig} from "../services/dropbox";
import {fileDownloadAjaxConfig} from "../services/dropbox";
import {fileUploadAjaxConfig} from "../services/dropbox";

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
    [filesDownloadRequestName, pathOrId],
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
    [filesUploadRequestName, pathOrId],
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
  console.log(completeRequest.name, completeRequest.status);
  if (completeRequest.name[0] !== listFolderRequestName) return {state};

  if (!completeRequest.success) {
    return reduceSyncRequestFailure(state);
  }

  let effect: SideEffect | void;
  let response = getDropboxResult(completeRequest)
    .response as DropboxListFolderResponse;
  if (response) {
    ({state, effect} = sequenceReduction(
      effect,
      startSyncDownload(state, response)
    ));
    ({state, effect} = sequenceReduction(
      effect,
      checkSyncDownloadComplete(state, false)
    ));
  }

  return {state, effect};
}

function completeFileUpload(
  state: State,
  completeRequest: CompleteRequest
): ReductionWithEffect<State> {
  if (completeRequest.name[0] !== filesUploadRequestName) return {state};

  const pathOrId = completeRequest.name[1];
  const conflict = completeRequest.status === 409;
  if (!completeRequest.success && !conflict) {
    return reduceSyncRequestFailure(state);
  }

  let effect: SideEffect | void;

  state = {...state};
  let idx = state.remainingUploads.indexOf(pathOrId);
  if (idx !== -1) {
    state.remainingUploads = state.remainingUploads.slice();
    state.remainingUploads.splice(idx, 1);
  }

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

  effect = sequence(effect, requestLocalStoreUpdate(state));
  ({state, effect} = sequenceReduction(effect, checkUploadSyncComplete(state)));

  return {state, effect};
}

function completeFileDownload(
  state: State,
  completeRequest: CompleteRequest
): ReductionWithEffect<State> {
  if (completeRequest.name[0] !== filesDownloadRequestName) return {state};

  const missingFile = completeRequest.status === 409;
  const pathOrId = completeRequest.name[1];
  if (!completeRequest.success && !missingFile) {
    return reduceSyncRequestFailure(state);
  }

  let effect: SideEffect | void;

  state = {...state};

  state.executingDownloads = state.executingDownloads.slice();
  state.executingDownloads.splice(
    state.executingDownloads.indexOf(pathOrId),
    1
  );

  if (completeRequest.success) {
    const dropboxResult = getDropboxResult(completeRequest);
    let downloadedNote: NormalizedNote;
    try {
      downloadedNote = parseNote(dropboxResult.content || "");
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        downloadedNote = {...newNormalizedNote};
        downloadedNote.attributes = {...downloadedNote.attributes};
        downloadedNote.attributes.content = dropboxResult.content || "";
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

    effect = sequence(effect, requestLocalStoreUpdate(state));
  }

  ({state, effect} = sequenceReduction(
    effect,
    checkSyncDownloadComplete(state, completeRequest.success)
  ));

  return {state, effect};
}

export function reduceSync(
  state: State,
  action: CompleteRequest | IgnoredAction
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "complete-request":
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
  }

  return {state, effect};
}

function checkSyncDownloadComplete(
  state: State,
  alreadyRequestingStore: boolean
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  if (state.executingDownloads.length) {
    return {state, effect};
  }

  state = {...state};
  if (!state.syncingListFolder) {
    return {state, effect};
  }

  const downloadedNotes: {[k: string]: NoteTree} = {};
  state.downloadedNotes.forEach(n => {
    downloadedNotes[n.note.id] = n;
  });

  state.downloadedNotes = [];

  state.indexes = {...state.indexes};

  function loadDownloaded(id: string) {
    let downloaded = downloadedNotes[id];
    let existing = Indexer.getFirstMatching(state.indexes.notes.byId, [id]);

    if (existing) {
      state.indexes = removeNote(state.indexes, existing);
    }

    if (downloaded) {
      state.indexes = loadIndexables(state.indexes, [downloaded]);
    }
  }

  state.syncingListFolder.entries.forEach(entry => {
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
      loadDownloaded(file.id);
    }
  });

  let hasConflicts = Indexer.getAllMatching(
    state.indexes.notes.byHasConflicts,
    [true]
  );
  hasConflicts.forEach(note => {
    loadDownloaded(note.id);
  });

  state.settings = {...state.settings};
  state.settings.session = {...state.settings.session};
  state.settings.session.syncCursor = state.syncingListFolder.cursor;

  if (!alreadyRequestingStore)
    effect = sequence(effect, requestLocalStoreUpdate(state));

  if (state.syncingListFolder.has_more) {
    effect = sequence(
      effect,
      requestListFolder(
        state.settings.session.accessToken,
        state.syncingListFolder.cursor
      )
    );
  }

  state.finishedSyncCount += 1;

  return {state, effect};
}

function checkUploadSyncComplete(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  if (state.remainingUploads.length) return {state, effect};

  state = {...state};

  let listFolderRequest = requestListFolder(
    state.settings.session.accessToken,
    state.settings.session.syncCursor
  );
  state.clearSyncEffects = sequence(
    state.clearSyncEffects,
    abortRequest(listFolderRequest.name)
  );
  effect = sequence(effect, listFolderRequest);

  return {state, effect};
}

export function clearOtherSyncProcesses(
  state: State
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  state = {...state};

  effect = sequence(effect, state.clearSyncEffects);
  state.clearSyncEffects = null;

  return {state, effect};
}

function startSyncDownload(
  state: State,
  response: DropboxListFolderResponse
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  state = {...state};

  if (
    !state.settings.session.accessToken ||
    state.now / 1000 > state.settings.session.sessionExpiresAt
  ) {
    state.syncAuthBad = true;
    return {state, effect};
  }

  let token = state.settings.session.accessToken;

  state.syncingListFolder = response;
  state.executingDownloads = [];
  const downloadedNoteRevs: {[k: string]: boolean} = {};
  state.downloadedNotes.forEach(
    n => (downloadedNoteRevs[n.note.version] = true)
  );

  let hasConflicts = Indexer.getAllMatching(
    state.indexes.notes.byHasConflicts,
    [true]
  );
  for (let note of hasConflicts) {
    let request = requestFileDownload(token, note.id);
    state.clearSyncEffects = sequence(
      state.clearSyncEffects,
      abortRequest(request.name)
    );
    effect = sequence(effect, request);
    state.executingDownloads.push(note.id);
  }

  for (let entry of response.entries) {
    if (entry[".tag"] === "file") {
      let rev = (entry as DropboxFileEntry).rev;
      if (downloadedNoteRevs[rev]) continue;

      let request = requestFileDownload(token, "rev:" + rev);
      state.clearSyncEffects = sequence(
        state.clearSyncEffects,
        abortRequest(request.name)
      );
      effect = sequence(effect, request);
      state.executingDownloads.push(entry.path_lower);
    }
  }

  return {state, effect};
}

function startSyncUpload(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  state = {...state};

  let hasEdits = Indexer.getAllMatching(state.indexes.notes.byHasLocalEdits, [
    true,
  ]);
  state.remainingUploads = [];

  for (let note of hasEdits) {
    let noteTree = findNoteTree(state.indexes, note.id);
    if (!noteTree) continue;
    let normalized = normalizedNote(noteTree);

    let request = requestFileUpload(
      state.settings.session.accessToken,
      note.id,
      note.version,
      stringifyNote(normalized),
    );
    state.clearSyncEffects = sequence(
      state.clearSyncEffects,
      abortRequest(request.name)
    );

    state.remainingUploads.push(note.id);
    effect = sequence(effect, request);
  }

  for (let key in state.newNotes) {
    let normalized = state.newNotes[key];
    let request = requestFileUpload(
      state.settings.session.accessToken,
      key,
      "",
      stringifyNote(normalized),
    );
    state.clearSyncEffects = sequence(
      state.clearSyncEffects,
      abortRequest(request.name)
    );
    state.remainingUploads.push(key);
    effect = sequence(effect, request);
  }

  ({state, effect} = sequenceReduction(effect, checkUploadSyncComplete(state)));

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

  if (
    !state.settings.session.accessToken ||
    state.now / 1000 > state.settings.session.sessionExpiresAt
  ) {
    state.syncAuthBad = true;
    state.finishedSyncCount += 1;
    return {state, effect};
  }

  ({state, effect} = sequenceReduction(effect, startSyncUpload(state)));

  return {state, effect};
}
