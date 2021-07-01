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