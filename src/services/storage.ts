import 'regenerator-runtime';
import {Dexie} from "dexie";
import {FileMetadata} from "./sync";
import {bindSome, fromVoid, Maybe, some, withDefault} from "../utils/maybe";
import {Semaphore} from "../utils/semaphore";

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
  return bindSome(getExt(name), ext => fromVoid(allContentTypes[ext.toLowerCase()]));
}

export const audioContentTypes: { [k: string]: string } = {
  "mp3": "audio/mpeg", "ogg": "audio/ogg", "wav": "audio/wav", "opus": "audio/opus",
};

export const videoContentTypes: { [k: string]: string } = {
  "mp4": "video/mp4", "ogg": "video/ogg"
};


export const noteContentTypes: { [k: string]: string } = {
  "text": "text/plain; charset=UTF-8",
};

export const allContentTypes = {...audioContentTypes, ...noteContentTypes, ...videoContentTypes};

export interface StoredMetadata extends FileMetadata {
  ext: string,
  dirty: 0 | 1,
  updatedAt: number,
  deleted?: true,
}

export interface StoredBlob extends StoredMetadata {
  blob: Blob,
}

export class FileStore {
  writeSemaphore = new Semaphore();

  constructor(private db: Dexie) {
    this.db.version(2).stores({
      'cursors': '&backend',
      'metadata': '&id,path,dirty,ext',
      'blobs': '&id,path,ext,dirty',
    });
  }

  async markDeleted(id: string) {
    let storedMetadata: StoredMetadata = await this.db.table('metadata').where('id').equals(id).first();
    if (!storedMetadata) return;
    storedMetadata = {...storedMetadata, dirty: 1, updatedAt: Date.now(), deleted: true};
    await this.storeBlobAndMetadata(storedMetadata, new Blob());
  }

  fetchDirty(): Promise<StoredBlob[]> {
    return this.db.table('blobs').where('dirty').equals(1).toArray()
  }

  async allKeys(): Promise<string[]> {
    return this.db.table('metadata').toCollection().keys() as Promise<string[]>;
  }

  async clear() {
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

  async storeBlob(blob: Blob, metadata: FileMetadata, localChange: boolean): Promise<void> {
    const ext = withDefault(getExt(metadata.path), '');
    const storedMetadata: StoredMetadata = {...metadata, ext, dirty: localChange ? 1 : 0, updatedAt: Date.now()};
    await this.storeBlobAndMetadata(storedMetadata, blob);
  }

  private async storeBlobAndMetadata(storedMetadata: StoredMetadata, blob: Blob) {
    const storedBlob: StoredBlob = {...storedMetadata, blob};
    await this.writeSemaphore.ready(async () => {
      await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
        await this.db.table('metadata').put(storedMetadata);
        await this.db.table('blobs').put(storedBlob);
      })
    });
  }

  async deletePath(path: string): Promise<void> {
    await this.writeSemaphore.ready(async () => {
      await this.db.transaction('rw!', 'metadata', 'blobs', async () => {
        await this.db.table('metadata').where('path').between(path, path + "\uFFFE", true, false).delete();
        await this.db.table('blobs').where('path').between(path, path + "\uFFFE", true, false).delete();
        await this.db.table('metadata').where('path').equalsIgnoreCase(path).delete();
        await this.db.table('blobs').where('path').equalsIgnoreCase(path).delete();
      })
    });
  }

  async fetchBlob(id: string): Promise<Maybe<StoredBlob>> {
    return this.db.table('blobs').where('id').equals(id).first().then(fromVoid);
  }

  async fetchBlobsByExt(ext: string): Promise<StoredBlob[]> {
    return this.db.table('blobs').where('ext').equals(ext).toArray();
  }

  async fetchMetadataByExts(exts: string[]): Promise<StoredMetadata[]> {
    return this.db.table('metadata').where('ext').anyOf(exts).toArray();
  }
}

export function createId() {
  return 'xxxxyy-xxyy-xxyy-xxxxyy'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


export function readText(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsText(blob);
  })
}

export function readDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  })
}
