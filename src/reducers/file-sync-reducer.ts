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
import {UpdateFileList, writeFile} from "../services/files";
import {sequence, sequenceReduction} from "kamo-reducers/services/sequence";
import {StoredFile} from "../storage";
import {clearOtherSyncProcesses} from "./sync-reducer";
import {
  fileDownloadAjaxConfig,
  getMimeFromFileName,
  getDropboxResult,
  DropboxDownloadResponse,
} from "../services/dropbox";
import {requestLocalStoreUpdate} from "./session-reducer";
import {storedFilesIndexer} from "../indexes";

export function reduceFileSync(
  state: State,
  action: UpdateFileList | CompleteRequest | IgnoredAction
): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  switch (action.type) {
    case "complete-request":
      if (action.name[0] !== fileDownloadRequestName) break;

      let id = action.name[1];

      if (action.status === 409) {
        state = {...state};
        state.indexes = {...state.indexes};
        state.indexes.storedFiles = storedFilesIndexer.removeByPk(
          state.indexes.storedFiles, [id]);

        effect = sequence(effect, requestLocalStoreUpdate(state));
        ({state, effect} = sequenceReduction(effect, continueFileSync(state)));
        break;
      }

      if (!action.success) break;

      let result = getDropboxResult(action);
      let response = result.response as DropboxDownloadResponse;
      let extParts = response.path_lower.split(".");
      let rev = response.rev;
      let ext = extParts[extParts.length - 1];
      effect = sequence(
        effect,
        writeFile(id + "-" + rev + "." + ext, result.content as Blob, response.size)
      );
      break;

    case "update-file-list":
      state = {...state};
      state.awaiting = {...state.awaiting};
      state.awaiting["file-list"] = 0;
      state.fileNames = action.fileNames;
      state.loadedFiles = true;
      ({state, effect} = sequenceReduction(effect, continueFileSync(state)));
      break;
  }

  return {state, effect};
}

export function continueFileSync(state: State): ReductionWithEffect<State> {
  let effect: SideEffect | void = null;

  // local file list has not finished loading.
  if (!state.loadedFiles) return {state, effect};
  if (!state.authReady) return {state, effect};
  if (!state.indexesReady) return {state, effect};
  if (state.syncOffline) return {state, effect};
  if (state.syncAuthBad) return {state, effect};
  // currently running a sync
  if (state.awaiting["sync"]) return {state, effect};

  let missingStoredFiles = getMissingStoredFiles(state);
  if (
    state.downloadingFileId &&
    !missingStoredFiles.some(sf => sf.id === state.downloadingFileId)
  ) {
    ({state, effect} = sequenceReduction(
      effect,
      clearOtherSyncProcesses(state)
    ));
  }

  state = {...state};
  state.downloadingFileId = null;

  state.awaiting = {...state.awaiting};
  state.awaiting["file-sync-downloads"] = missingStoredFiles.length;

  if (missingStoredFiles.length > 0) {
    state.awaiting = {...state.awaiting};

    let nextFile = missingStoredFiles[0];
    let mime = getMimeFromFileName(nextFile.name);

    if (!mime) {
      throw new Error("Unknown mime for " + nextFile.name);
    }

    let request = requestFileDownload(
      state.settings.session.accessToken,
      nextFile.id,
      mime
    );

    state.downloadingFileId = nextFile.id;

    effect = sequence(effect, request);

    state.clearSyncEffects = sequence(
      state.clearSyncEffects,
      abortRequest(request.name)
    );
  }

  return {state, effect};
}

export const fileDownloadRequestName = "file-download";

export function requestFileDownload(
  accessToken: string,
  id: string,
  mimeType: string
): RequestAjax {
  return requestAjax(
    [fileDownloadRequestName, id],
    fileDownloadAjaxConfig(accessToken, id, mimeType, "blob")
  );
}

export function getMissingStoredFiles(state: State): StoredFile[] {
  let result = [] as StoredFile[];

  let revsForIds = {} as {[k: string]: string};
  state.fileNames.forEach(fn => {
    let parts = fn.split(".");
    parts = parts.slice(0, parts.length - 1).join(".").split("-");
    let id = parts.slice(0, parts.length - 1).join("-");
    let rev = parts[parts.length - 1];
    revsForIds[id] = rev;
  });

  state.indexes.storedFiles.byId.forEach(([_, sf]) => {
    if (revsForIds[sf.id] !== sf.revision) {
      result.push(sf);
    }
  });

  return result;
}
