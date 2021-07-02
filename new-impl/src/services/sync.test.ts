import {DropboxSyncBackend} from "./dropbox";
import {Dropbox} from "dropbox";
import {SyncBackend, syncFiles} from "./sync";
import {Cancellable} from "../cancellable";

const dropboxSyncToken = process.env['DROPBOX_SYNC_TOKEN'] || '';
console.log(dropboxSyncToken)

describe('sync', () => {
    const backends: SyncBackend[] = [new DropboxSyncBackend(new Dropbox({ accessToken: dropboxSyncToken }))];
    backends.forEach(backend => {
        describe((backend as any).constructor.name, () => {
            describe('sync down process', () => {
                it('e2e works', async () => {
                    for (let progress of syncFiles(new Cancellable(), backend)) {
                    }
                })
            })
        })
    })
})