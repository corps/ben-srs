import {Subject, Subscriber, Subscription} from "kamo-reducers/subject";
import {
  GlobalAction,
  IgnoredSideEffect,
  SideEffect,
} from "kamo-reducers/reducers";

const MIN_STORAGE_BYTES = 1024 * 1024 * 1024;

export interface WriteFile {
  effectType: "write-file";
  fileName: string;
  bytes: number;
  data: Blob;
}

export interface DeleteFiles {
  effectType: "delete-files";
  fileNames: string[];
}

export interface UpdateFileList {
  type: "update-file-list";
  fileNames: string[];
}

export interface RequestFileList {
  effectType: "request-file-list";
}

export interface PlayAudioFile {
  effectType: "play-audio-file";
  fileName: string;
}

export function playAudioFile(fileName: string): PlayAudioFile {
  return {fileName, effectType: "play-audio-file"};
}

export function requestFileList(): RequestFileList {
  return {effectType: "request-file-list"};
}

export function updateFileList(fileNames: string[]): UpdateFileList {
  return {type: "update-file-list", fileNames};
}

export function writeFile(
  fileName: string,
  data: Blob,
  bytes: number
): WriteFile {
  return {
    effectType: "write-file",
    fileName,
    data,
    bytes,
  };
}

export function deleteFiles(fileNames: string[]): DeleteFiles {
  return {
    effectType: "delete-files",
    fileNames,
  };
}

export type FileEffect =
  | WriteFile
  | DeleteFiles
  | RequestFileList
  | PlayAudioFile;

interface FileApiStorage {
  requestQuota(
    bytes: number,
    cb: (granted: number) => void,
    errCb: (err: any) => void
  ): void;

  queryUsageAndQuota(
    cb: (used: number, remaining: number) => void,
    errCb: (err: any) => void
  ): void;
}

interface FileWriter {
  onwriteend(): void;
  onerror(err: any): void;
  write(blob: Blob): void;
}

interface FileEntry {
  createWriter(cb: (fw: FileWriter) => void): void;
  remove(cb: () => void, errCb: (err: any) => void): void;
  file(cb: (file: File) => void): void;
  blob?: Blob
}

interface DirectoryEntry {
  name: string;
}

interface DirectoryReader {
  readEntries(
    cb: (results: DirectoryEntry[]) => void,
    errCb: (err: any) => void
  ): void;
}

interface DirectoryNode {
  getFile(
    name: string,
    opts: {create?: boolean},
    cb: (fileEntry: FileEntry) => void
  ): void;

  createReader(): DirectoryReader;
}
interface FileSystem {
  root: DirectoryNode;
}

type RequestFileSystem = (
  type: 1,
  bytes: number,
  cb: (fs: FileSystem) => void
) => void;

const storage: FileApiStorage = (window.navigator as any)
  .webkitPersistentStorage;

const requestFileSystem: RequestFileSystem = (window as any)
  .webkitRequestFileSystem;

function inMemoryFs(): FileSystem {
  function makeRoot(): DirectoryNode {
    const files =  {} as {[k: string]: FileEntry};
    return {
      getFile(
          name: string,
          opts: {create?: boolean},
          cb: (fileEntry: FileEntry) => void
      ): void {
        const file = files[name] || (files[name] = {
          createWriter(cb: (fw: FileWriter) => void) {
            setTimeout(() => cb({
              onwriteend: null,
              onerror: null,
              write(blob: Blob) {
                console.log("writing blob", name);
                file.blob = blob;
                setTimeout(() => this.onwriteend(), 0);
              },
            }));
          },
          remove(cb: () => void, errCb: (err: any) => void) {
            console.log("remove?");
            delete files[name];
            setTimeout(cb, 0);
          },
          file(cb: (file: File) => void) {
              setTimeout(() => {
                console.log("file callback", name);
                cb(new File([file.blob], name));
              }, 0);
          }
        }) as FileEntry;
        console.log("getting file", file, files);

        setTimeout(() => cb(file), 0);
      },
      createReader(): DirectoryReader {
        return {
          readEntries(
              cb: (results: DirectoryEntry[]) => void,
              errCb: (err: any) => void
          ): void {
            this.readEntries = (cb: any) => setTimeout(() => cb([]), 0);
            setTimeout(() => cb(Object.keys(files).map(name => ({ name }))));
          },
        }
      }
    };
  }

  return {
    root: makeRoot(),
  }
}

const memoryFs = inMemoryFs();
export function withFs(cb: (fs: FileSystem) => void, spaceNeeded = 0): void {
  if (!storage || !requestFileSystem) {
    cb(memoryFs);
    return;
  }

  storage.queryUsageAndQuota(
    (used, remaining) => {
      let total = used + remaining;

      if (remaining < spaceNeeded) {
        let requestSize = Math.max(
          MIN_STORAGE_BYTES,
          (total + spaceNeeded) * 2
        );
        console.log(
          "requesting",
          requestSize,
          spaceNeeded,
          remaining,
          total,
          used
        );
        storage.requestQuota(
          requestSize,
          granted => {
            console.log("calling request file system", granted);
            requestFileSystem(1, granted, cb);
          },
          err => {
            console.error(err);
          }
        );
      } else {
        requestFileSystem(1, total, cb);
      }
    },
    err => {
      console.error(err);
    }
  );
}

function dispatchRootContents(
  fs: FileSystem,
  dispatch: (action: GlobalAction) => void
) {
  let reader = fs.root.createReader();

  console.log("dispatch root contents")
  let results: DirectoryEntry[] = [];
  function readEntries() {
    reader.readEntries(
      entries => {
        if (entries.length) {
          results = results.concat(entries);
          readEntries();
        } else {
          console.log("root contents got", results);
          dispatch(updateFileList(results.map(e => e.name)));
        }
      },
      err => {
        console.error(err);
      }
    );
  }

  readEntries();
}

export function withFiles(
  effect$: Subject<SideEffect>
): Subscriber<GlobalAction> {
  return {
    subscribe: (dispatch: (a: GlobalAction) => void) => {
      let subscription = new Subscription();

      let dataUrlsOfFiles = {} as {[k: string]: string};

      function playAudioFile(fileName: string): boolean {
        let dataUrl = dataUrlsOfFiles[fileName];
        if (dataUrl) {
          let audio = new Audio(dataUrl);
          audio.play();
          return true;
        }
        return false;
      }

      subscription.add(
        effect$.subscribe((effect: FileEffect | IgnoredSideEffect) => {
          switch (effect.effectType) {
            case "play-audio-file":
              if (playAudioFile(effect.fileName)) break;

              withFs(fs => {
                fs.root.getFile(effect.fileName, {}, entry => {
                  entry.file(f => {
                    let reader = new FileReader();
                    reader.onload = e => {
                      dataUrlsOfFiles[effect.fileName] = reader.result;
                      setTimeout(() => playAudioFile(effect.fileName), 100);
                    };

                    reader.readAsDataURL(f);
                  });
                });
              });

              break;

            case "request-file-list":
              withFs(fs => dispatchRootContents(fs, dispatch));
              break;

            case "delete-files":
              withFs(fs => {
                let awaitingNum = effect.fileNames.length;

                if (!awaitingNum) {
                  dispatchRootContents(fs, dispatch);
                  return;
                }

                effect.fileNames.forEach(fileName => {
                  fs.root.getFile(fileName, {}, entry => {
                    entry.remove(
                      () => {
                        if (!--awaitingNum) {
                          dispatchRootContents(fs, dispatch);
                        }
                      },
                      err => {
                        console.error(err);
                        if (!--awaitingNum) {
                          dispatchRootContents(fs, dispatch);
                        }
                      }
                    );
                  });
                });
              });

              break;

            case "write-file":
              console.log("write file");
              withFs(fs => {
                fs.root.getFile(effect.fileName, {create: true}, entry => {
                  entry.createWriter(writer => {
                    writer.onerror = err => console.error(err);
                    writer.write(effect.data);
                    writer.onwriteend = () => {
                      delete dataUrlsOfFiles[effect.fileName];
                      dispatchRootContents(fs, dispatch);
                    };
                  });
                });
              }, effect.bytes);

              break;
          }
        })
      );

      return subscription.unsubscribe;
    },
  };
}
