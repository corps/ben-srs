import {DropboxSyncBackend} from "./dropbox";
import {Dropbox} from "dropbox";
import {SyncBackend, syncFiles} from "./sync";
import {Cancellable} from "../cancellable";
import Dexie from "dexie";
import {FileStore} from "./storage";

const dropboxSyncToken = process.env['DROPBOX_SYNC_TOKEN'] || '';
console.log(dropboxSyncToken)

describe('sync', () => {
    const backends: SyncBackend[] = [new DropboxSyncBackend(new Dropbox({ accessToken: dropboxSyncToken }))];
    backends.forEach(backend => {
        let dexie: Dexie = new Dexie(`${backend}BackendSync`)
        let store: FileStore = new FileStore(dexie, true);

        describe((backend as any).constructor.name, () => {
            describe('sync down process', () => {
                it('e2e works', async () => {
                    const [syncProcess, finished] = syncFiles(new Cancellable(), backend, store);
                    for (let progress of syncProcess) {
                        const data = await progress;
                        // console.log(data);
                    }

                    console.log('done')
                    await finished;
                }, 60000000)
            });
        });
    });
});