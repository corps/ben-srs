import 'regenerator-runtime';
import {Dexie} from "dexie";
import {FileMetadata} from "./sync";
import {bindSome, fromVoid, mapSome, Maybe, some, withDefault} from "../utils/maybe";

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
    return some(parts[parts.length - 1]);
  }

  return null;
}

export function getMimeFromFileName(name: string): Maybe<string> {
    return bindSome(getExt(name), ext => fromVoid(audioContentTypes[ext.toLowerCase()]));
}

export const audioContentTypes: {[k: string]: string} = {
  "mp3": "audio/mpeg",
  "ogg": "audio/ogg",
  "wav": "audio/wav",
  "opus": "audio/opus",
};

export interface StoredMetadata extends FileMetadata {
  ext: string,
  dirty: 0 | 1,
  updatedAt: number,
}

export interface StoredBlob extends StoredMetadata {
  blob: Blob,
}

export class FileStore {
  constructor(private db: Dexie, private blobHack = false) {
    this.db.version(1).stores({
      'cursors': '&backend',
      'metadata': '&id,path,dirty',
      'blobs': '&id,path,ext,dirty',
    });
  }

  fetchDirty(): Promise<StoredBlob[]> {
    return this.db.table('blobs').where('dirty').equals(1).toArray()
  }

  async allKeys(): Promise<string[]> {
    return this.db.table('metadata').toCollection().keys() as Promise<string[]>;
  }

  async clear() {
    await this.db.table('metadata').clear();
    await this.db.table('blobs').clear();
    await this.db.table('cursors').clear();
  }

  async storeCursor(cursor: string) {
    await this.db.table('cursors').put({ backend: 'default', cursor });
  }

  async getCursor() {
    const cursor = await this.db.table('cursors').where('backend').equals('default').first();
    return cursor?.cursor || "";
  }

  async storeBlob(blob: Blob, metadata: FileMetadata, localChange: boolean): Promise<void> {
    const ext = withDefault(getExt(metadata.path), '');

    await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
      const storedMetadata: StoredMetadata = { ...metadata, ext, dirty: localChange ? 1 : 0, updatedAt: Date.now() };
      const storedBlob: StoredBlob = {...storedMetadata, blob };
      await this.db.table('metadata').put(storedMetadata);
      await this.db.table('blobs').put(storedBlob);
    })
  }

  async deletePath(path: string): Promise<void> {
    await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
      await this.db.table('metadata').where('path').between(path,
          path + "\uFFFE", true, false).delete();
      await this.db.table('blobs').where('path').between(path,
          path + "\uFFFE", true, false).delete();
    })
  }

  async fetchBlob(id: string): Promise<Maybe<StoredBlob>> {
    return this.db.table('blobs').where('id').equals(id).first().then(fromVoid);
  }

  async fetchBlobsByExt(ext: string): Promise<StoredBlob[]> {
    return this.db.table('blobs').where('ext').equals(ext).toArray();
  }

  async fetchMetadataByExts(exts: string[]): Promise<FileMetadata[]> {
    return this.db.table('metadata').where('ext').anyOf(exts).toArray();
  }
}

export function createId() {
  return 'xxxxyy-xxyy-xxyy-xxxxyy'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}