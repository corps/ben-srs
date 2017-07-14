import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {GlobalAction, IgnoredSideEffect, SideEffect} from "kamo-reducers/reducers";
import Dropbox = require("dropbox");
import {newNote, Note} from "../model";

export interface RequestDropboxSync {
  effectType: "request-dropbox-sync"
  cursor: string
  accessToken: string
}

export function requestDropboxSync(cursor: string, accessToken: string): RequestDropboxSync {
  return {
    effectType: "request-dropbox-sync",
    cursor, accessToken
  }
}

export interface DropboxSyncRow {
  deletionPath?: string | 0
  note?: Note | 0
}

export interface DropboxSyncCompletion {
  type: "dropbox-sync-completion"
  cursor: string
  accessToken: string
  rows: DropboxSyncRow[]
}

export function dropboxSyncCompletion(cursor: string, accessToken: string,
                                      rows: DropboxSyncCompletion[]): DropboxSyncCompletion {
  return {type: "dropbox-sync-completion", cursor, accessToken, rows};
}

export function isDeletedMetaData(m: DropboxTypes.files.Metadata): m is DropboxTypes.files.DeletedMetadataReference {
  return (m as any)['.tag'] === 'deleted';
}

export function isFileMetaData(m: DropboxTypes.files.Metadata): m is DropboxTypes.files.FileMetadataReference {
  return (m as any)['.tag'] === 'file';
}

export function isFolderMetaData(m: DropboxTypes.files.Metadata): m is DropboxTypes.files.FolderMetadataReference {
  return (m as any)['.tag'] === 'folder';
}

export function withDropbox(effect$: Subject<SideEffect>): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();
      let client: Dropbox;
      let promise: Promise<DropboxTypes.files.ListFolderResult>;
      let running = false;
      let buffered: SideEffect;

      subscription.add(effect$.subscribe((effect: RequestDropboxSync | IgnoredSideEffect) => {
        switch (effect.effectType) {
          case "request-dropbox-sync":
            if (running) {
              buffered = effect;
              break;
            }

            client = new Dropbox({accessToken: effect.accessToken, clientId: process.env.DROPBOX_CLIENT_ID});

            if (effect.cursor) {
              let args = {} as DropboxTypes.files.ListFolderArg;
              args.recursive = true;
              args.include_deleted = true;

              promise = client.filesListFolder(args);
            } else {
              let args = {} as DropboxTypes.files.ListFolderContinueArg;
              args.cursor = effect.cursor;

              promise = client.filesListFolderContinue(args);
            }

            promise.then((result: DropboxTypes.files.ListFolderResult) => {
              let cursor = result.cursor;
              let rows = [] as DropboxSyncRow[];
              let noteRequests = [] as Promise<any>[];

              result.entries.forEach(entry => {
                switch (entry['.tag']) {
                  case "deleted":
                    rows.push({deletionPath: entry.path_lower});
                    break;

                  case "file":
                    let fileMeta = entry as DropboxTypes.files.FileMetadataReference;
                    let downloadArgs: DropboxTypes.files.DownloadArg = {path: "rev:" + fileMeta.rev};

                    noteRequests.push(client.filesDownload(downloadArgs).then(result => {
                      return new Promise<any>((resolve, reject) => {
                        let blob = (result as any).fileBlob as Blob;
                        let fileReader = new FileReader();
                        let note = {...newNote};
                        note.id = fileMeta.id;

                        fileReader.onloadend = (ev) => {
                          let body = (ev.srcElement as any).result as string;
                        }

                        fileReader.readAsText(blob, "utf-8");
                      })
                    }));
                }
              })

            }).catch((e) => {
            }).then(() => {
              running = false;
              if (buffered) {
                let run = buffered;
                buffered = null;
                effect$.dispatch(run);
              }
            });
        }
      }));

      return subscription.unsubscribe;
    }
  };
}
