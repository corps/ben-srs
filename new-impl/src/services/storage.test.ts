import {FileStore} from "./storage";
import Dexie from "dexie";
import {FileMetadata} from "./sync";

describe('FileStore', () => {
    describe('with some data stored', () => {
        let dexie: Dexie = new Dexie('fileStoreTest')
        let store: FileStore = new FileStore(dexie, true);

        const a = new Blob(["a text"]);
        const b = new Blob(["b text"]);
        const c = new Blob(["c text"]);

        const aMeta: FileMetadata = {path: "/dir1/a", size: 1, id: "a", rev: "rev:a"};
        const bMeta: FileMetadata = {path: "/dir1/dir2/b", size: 1, id: "b", rev: "rev:b"};
        const cMeta: FileMetadata = {path: "/dir3/c", size: 1, id: "c", rev: "rev:c"};

        beforeEach(async () => {
            await store.storeBlob(a, aMeta, true);
            await store.storeBlob(b, bMeta, false);
            await store.storeBlob(c, cMeta, true);
        })

        afterEach(async () => {
            await store.clear();
        })

        describe('fetchMetadata', () => {
            it('returns all metadata entries by id', async () => {
                const metadata = await store.fetchMetadata();
                expect(metadata.map(({path, size, id, rev}) => ({path, size, id, rev}))).toEqual([aMeta, bMeta, cMeta])
            })
        })

        describe('fetchBlobs', () => {
            it('fetches the stored blobs by the given ids', async () => {
                const blobs = await store.fetchBlobs(['a', 'c']);
                expect(blobs).toEqual([a, c])
            })
        })

        describe('deletePath', () => {
            it('works on recursively directories', async () => {
                await store.deletePath('/dir1')
                const metadata = await store.fetchMetadata();
                expect(metadata.map(({path, size, id, rev}) => ({path, size, id, rev}))).toEqual([cMeta])
            })

            it('works on individual files', async () => {
                await store.deletePath(aMeta.path);
                const metadata = await store.fetchMetadata();
                expect(metadata.map(({path, size, id, rev}) => ({path, size, id, rev}))).toEqual([bMeta, cMeta])
            })
        })

        describe('allKeys', () => {
            it('works', async() => {
                const keys = await store.allKeys();
                expect(keys).toEqual(['a', 'b', 'c']);
            })
        })
    })
})