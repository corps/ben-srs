import 'regenerator-runtime';
import {Dexie} from "dexie";
import {FileMetadata} from "./sync";
import {bindSome, fromVoid, Maybe, some, withDefault} from "../utils/maybe";
import {Semaphore} from "../utils/semaphore";
import {Indexed, Indexer} from "../utils/indexable";

export function withNamespace(storage: Storage, ns: string): Storage {
  return {
    getItem(key: string): string | null {
      return storage.getItem(`${ns}${key}`);
    }, key(index: number): string | null {
      if (index < 0) return null;
      const {length} = storage;

      let i = 0;
      for (let j = 0; j < length; ++j) {
        const key = storage.key(j);
        if (key == null) return null;
        const supkey = key.slice(0, ns.length)

        if (supkey === ns) {
          if (i === index) return key.slice(ns.length);
          i++;
        }
      }

      return null;
    }, get length(): number {
      const {length} = storage;

      let i = 0;
      for (let j = 0; j < length; ++j) {
        const key = storage.key(j);
        if (key == null) break;
        const supkey = key.slice(0, ns.length)

        if (supkey === ns) {
          i++;
        }
      }

      return i;
    }, removeItem(key: string): void {
      storage.removeItem(`${ns}${key}`)
    }, setItem(key: string, value: string): void {
      storage.setItem(`${ns}${key}`, value);
    }, clear(): void {
      const {length} = storage;

      for (let j = 0; j < length; ++j) {
        const key = storage.key(j);
        if (key == null) break;
        const supkey = key.slice(0, ns.length)

        if (supkey === ns) {
          storage.removeItem(key);
        }
      }
    }
  }
}

export function getExt(name: string): Maybe<string> {
  let parts = name.split(".");
  if (parts.length > 0) {
    return some(parts[parts.length - 1].toLowerCase());
  }

  return null;
}

export function getMimeFromFileName(name: string): Maybe<string> {
  return bindSome(getExt(name), ext => fromVoid(allContentTypes[ext]));
}

export const imageContentTypes: { [k: string]: string } = {
  "jpg": "image/jpeg", "jpeg": "image/jpeg",
  "png": "image/png",　"svg": "image/svg+xml",
  "gif": "image/gif", "bmp": "image/bmp",
  "tiff": "image/tiff", "ico": "image/x-icon",
};

export const audioContentTypes: { [k: string]: string } = {
  "mp3": "audio/mpeg", "ogg": "audio/ogg", "wav": "audio/wav", "opus": "audio/opus",
};

export const videoContentTypes: { [k: string]: string } = {
  "mp4": "video/mp4", "ogg": "video/ogg"
};


export const noteContentTypes: { [k: string]: string } = {
  "text": "text/plain; charset=UTF-8",
};

export const allContentTypes = {...audioContentTypes, ...noteContentTypes, ...videoContentTypes, ...imageContentTypes};

export interface StoredMetadata extends FileMetadata {
  ext: string,
  dirty: 0 | 1 | 2,
  updatedAt: number,
  deleted?: true,
}

export interface StoredMedia extends StoredMetadata {
  blob: StoredBlob,
}

export interface ArrayBufferEnvelop {
  size: number,
  type: string,
  data: ArrayBuffer,
}

export type StoredBlob = Blob | ArrayBufferEnvelop;

export type DirtyStoreIndex = {
  byPath: Indexed<StoredMedia>;
  byId: Indexed<StoredMedia>;
  byDirty: Indexed<StoredMedia>;
};

export const dirtyStoreIndexer = new Indexer<StoredMedia, DirtyStoreIndex>("byId");
dirtyStoreIndexer.setKeyer("byPath", ({path}) => path.split("/"));
dirtyStoreIndexer.setKeyer("byId", ({id}) => [id]);
dirtyStoreIndexer.setKeyer("byDirty", ({dirty}) => [dirty]);

export class FileStore {
  writeSemaphore = new Semaphore();
  dirtyIndex = dirtyStoreIndexer.empty();
  metaLoaded: Promise<void>;

  constructor(private db: Dexie) {
    this.db.version(2).stores({
      'cursors': '&backend',
      'metadata': '&id,path,dirty,ext',
      'blobs': '&id,path,ext,dirty',
    });

    this.metaLoaded = this.db.table('blobs').where('dirty').above(0).toArray().then(media => {
      this.dirtyIndex = dirtyStoreIndexer.update(this.dirtyIndex, media);
    });
  }

  async markDeleted(id: string) {
    let storedMetadata: StoredMetadata = await this.db.table('metadata').where('id').equals(id).first();
    if (!storedMetadata) return;
    storedMetadata = {...storedMetadata, dirty: 1, updatedAt: Date.now(), deleted: true};
    await this.storeBlobAndMetadata(storedMetadata, new Blob());
  }

  private replaceFromDirty(medias: StoredMedia[]): StoredMedia[] {
    const byId: {[k: string]: StoredMedia} = {};
    this.dirtyIndex.byId[1].map(media => {
      byId[media.id] = media;
    })

    return medias.map(media => {
      if (media.id in byId) {
        const entry = byId[media.id];
        if (entry.dirty === 1) return entry;
      }
      return media;
    })
  }

  async fetchDirty(): Promise<StoredMedia[]> {
    await this.metaLoaded;
    return Indexer.getAllMatching(this.dirtyIndex.byDirty, [1]);
  }

  async fetchConflicted(): Promise<StoredMedia[]> {
    await this.metaLoaded;
    return Indexer.getAllMatching(this.dirtyIndex.byDirty, [2]);
  }

  async clear() {
    await this.metaLoaded;
    this.dirtyIndex = dirtyStoreIndexer.empty();
    await this.writeSemaphore.ready(async () => {
      await this.db.table('metadata').clear();
      await this.db.table('blobs').clear();
      await this.db.table('cursors').clear();
    });
  }

  async storeCursor(cursor: string) {
    await this.writeSemaphore.ready(async () => {
      await this.db.table('cursors').put({backend: 'default', cursor});
    });
  }

  async getCursor() {
    const cursor = await this.db.table('cursors').where('backend').equals('default').first();
    return cursor?.cursor || "";
  }

  async storeBlob(blob: Blob, metadata: FileMetadata, localChange: boolean | 2): Promise<void> {
    const ext = withDefault(getExt(metadata.path), '');
    const storedMetadata: StoredMetadata = {...metadata, ext, dirty: localChange ? localChange === 2 ? 2 : 1 : 0, updatedAt: Date.now()};
    await this.storeBlobAndMetadata(storedMetadata, blob);
  }

  private async storeBlobAndMetadata(storedMetadata: StoredMetadata, blob: Blob) {
    const data = await readAsArrayBuffer(blob);
    const type = withDefault(getMimeFromFileName(storedMetadata.path), blob.type);
    const storedBlob: ArrayBufferEnvelop = { data, type, size: blob.size };
    const media: StoredMedia = {...storedMetadata, blob: storedBlob };
    await this.metaLoaded;

    const work = this.writeSemaphore.ready(async () => {
      await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
        await this.db.table('metadata').put(storedMetadata);
        await this.db.table('blobs').put(media);
      })
    });

    if (storedMetadata.dirty) {
      this.dirtyIndex = dirtyStoreIndexer.update(this.dirtyIndex, [media]);
    } else {
      this.dirtyIndex = dirtyStoreIndexer.removeByPk(this.dirtyIndex, [media.id]);
    }

    await work;
  }

  async deleteId(id: string): Promise<void> {
    await this.metaLoaded;
    this.dirtyIndex = dirtyStoreIndexer.removeByPk(this.dirtyIndex, [id]);
    await this.writeSemaphore.ready(async () => {
      await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
        await this.db.table('blobs').where('id').equals(id).delete();
        await this.db.table('metadata').where('id').equals(id).delete();
      })
    });
  }

  async deletePath(path: string): Promise<void> {
    await this.metaLoaded;
    this.dirtyIndex = dirtyStoreIndexer.removeAll(this.dirtyIndex, Indexer.getAllMatching(this.dirtyIndex.byPath, path.split("/")));

    await this.writeSemaphore.ready(async () => {
      await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
        await this.db.table('metadata').where('path').between(path, path + "\uFFFE", true, false).delete();
        await this.db.table('blobs').where('path').between(path, path + "\uFFFE", true, false).delete();
        await this.db.table('metadata').where('path').equalsIgnoreCase(path).delete();
        await this.db.table('blobs').where('path').equalsIgnoreCase(path).delete();
      })
    });
  }

  async fetchBlob(id: string): Promise<Maybe<StoredMedia>> {
    const match = Indexer.getFirstMatching(this.dirtyIndex.byId, [id]);
    if (match) return Promise.resolve(match);
    return this.db.table('blobs').where('id').equals(id).first().then(fromVoid);
  }

  async fetchBlobByPath(path: string): Promise<Maybe<StoredMedia>> {
    const match = Indexer.getFirstMatching(this.dirtyIndex.byPath, [path]);
    if (match) return Promise.resolve(match);
    return this.db.table('blobs').where('path').equals(path).first().then(fromVoid);
  }


  async fetchBlobsByExt(ext: string): Promise<StoredMedia[]> {
    return this.db.table('blobs').where('ext').equals(ext).toArray().then(media => this.replaceFromDirty(media));
  }

  async fetchMetadataByExts(exts: string[]): Promise<StoredMetadata[]> {
    return this.db.table('metadata').where('ext').anyOf(exts).toArray().then(media => this.replaceFromDirty(media));
  }
}

export function createId() {
  return 'xxxxyy-xxyy-xxyy-xxxxyy'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export function readText(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = (e) => reject(fr.error);
    fr.readAsText(blob)
  })
}

export function readDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = (e) => reject(fr.error);
    fr.readAsDataURL(blob);
  })
}

export function normalizeBlob(blob: StoredBlob): Blob {
  if (blob instanceof Blob) return blob;
  return new Blob([blob.data], { type: blob.type });
}

export function readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.onerror = reject;
    fr.readAsArrayBuffer(blob);
  })
}
