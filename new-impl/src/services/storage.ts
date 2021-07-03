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
    return bindSome(getExt(name), ext => fromVoid(contentTypes[ext.toLowerCase()]));
}

export const contentTypes: {[k: string]: string} = {
  "mp3": "audio/mpeg",
  "ogg": "audio/ogg",
  "wav": "audio/wav",
  "opus": "audio/opus",
};

// For testing purposes, as node does not support blob in a reasonable fashion.
let blobHackIdx = 0;
let blobHack: any = {};

export class FileStore {
  public lastUpdatedAt = Date.now();

  constructor(private db: Dexie, private blobHack = false) {
    this.db.version(1).stores({
      'cursors': '&backend',
      'metadata': '&id,path,ext,dirty,updatedAt',
      'blobs': '&id,path',
    });
  }

  async allKeys(): Promise<string[]> {
    return this.db.table('metadata').toCollection().keys() as Promise<string[]>;
  }

  serializeBlob(blob: Blob): any {
    if (this.blobHack) {
      blobHack[++blobHackIdx] = blob;
      return blobHackIdx;
    }

    return blob
  }

  deserializeBlob(data: any): Blob {
    if (this.blobHack) {
      return blobHack[data];
    }

    return data;
  }

  async latestUpdate(): Promise<number> {
    const row = await this.db.table('metadata').orderBy('updatedAt').last();
    if (!row) return this.lastUpdatedAt;
    return row.updatedAt;
  }

  async clear() {
    await this.db.table('metadata').clear();
    await this.db.table('blobs').clear();
  }

  async storeCursor(cursor: string) {
    await this.db.table('cursors').put({ backend: 'default', cursor });
  }

  async getCursor() {
    const cursor = this.db.table('cursors').where('backend').equals('default').first();
    return cursor || "";
  }

  async storeBlob(blob: Blob, metadata: FileMetadata, localChange: boolean): Promise<void> {
    const ext = withDefault(getExt(metadata.path), '');

    const lastUpdatedAt = Date.now();
    await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
      const {id, path} = metadata;
      const storedMetadata = { ...metadata, ext, dirty: localChange, updatedAt: lastUpdatedAt };
      const serializedBlob = this.serializeBlob(blob);
      await this.db.table('metadata').put(storedMetadata);
      await this.db.table('blobs').put({ id, blob: serializedBlob, path });
    })

    this.lastUpdatedAt = lastUpdatedAt;
  }

  async deletePath(path: string): Promise<void> {
    await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
      await this.db.table('metadata').where('path').between(path,
          path + "\uFFFE", true, false).delete();
      await this.db.table('blobs').where('path').between(path,
          path + "\uFFFE", true, false).delete();
    })
  }

  async fetchBlobs(ids: string[]): Promise<Blob[]> {
    const data = await this.db.table('blobs').where('id').anyOf(ids).toArray();
    return data.map(({blob}) => this.deserializeBlob(blob));
  }

  async fetchText(ids: string[]): Promise<string[]> {
    const blobs = await this.fetchBlobs(ids);
    return Promise.all(blobs.map(blob => blob.text().catch(() => "/non text data/")));
  }

  async fetchMetadata(): Promise<FileMetadata[]> {
    return this.db.table('metadata').toArray();
  }
}

export function createId() {
  return 'xxxx-xxyy-xxyy-xxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}