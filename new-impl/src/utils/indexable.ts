import 'regenerator-runtime';
import {Maybe, some} from "./maybe";

export function arrayCmp(a: ReadonlyArray<any>, b: ReadonlyArray<any>): number {
    for (let i = 0; i < a.length && i < b.length; ++i) {
        let aVal = a[i];
        let bVal = b[i];

        if (aVal === bVal) continue;

        if (bVal === Infinity) return -1;
        if (aVal === Infinity) return 1;
        if (aVal == null) return -1;
        if (bVal == null) return 1;
        if (aVal < bVal) return -1;
        return 1;
    }

    if (a.length === b.length) return 0;
    if (a.length > b.length) return 1;
    return -1;
}

export function bisect<T, E>(array: ReadonlyArray<T>, e: E, cmp: (a: E, b: T) => number, l = 0, r = array.length) {
    let mid: number;
    let c: number;

    while (l < r) {
        mid = l + r >>> 1;
        c = cmp(e, array[mid]);
        if (c > 0) {
            l = mid + 1;
        } else {
            r = mid;
        }
    }

    return l;
}

export type Indexed<K extends any[], T> = [K[], T[]];
export class Index<K extends any[], T> {
    constructor(public data: Indexed<K, T> = [[], []]) {}

    dup(): Index<K, T> {
        return new Index<K, T>([[...this.data[0]], [...this.data[1]]]);
    }

    insert(k: K, t: T) {
        const [ks, ts] = this.data;
        const idx = bisect(ks, k, arrayCmp);
        ts.splice(idx, 0, t);
        ks.splice(idx, 0, k);
    }

    remove(k: K) {
        const [ks, ts] = this.data;
        const idx = bisect(ks, k, arrayCmp);
        if (arrayCmp(ks[idx], k) !== 0) return;
        ts.splice(idx, 1);
        ks.splice(idx, 1);
    }

    find(k: K): Maybe<T> {
        const [ks, ts] = this.data;
        const [l, r] = this.range(k, [...k, Infinity]);
        if (r > l) return some(ts[l]);
        return null;
    }

    findAll(k: K): T[] {
        const [ks, ts] = this.data;
        const [l, r] = this.range(k, [...k, Infinity]);
        return this.slice([l, r]);
    }

    get length() {
        return this.data[0].length;
    }

    removeRange([l, r]: [number, number]) {
        const [ks, ts] = this.data;
        ts.splice(l, r - l);
        ks.splice(l, r - l);
    }

    range(start: any[], end: any[]): [number, number] {
        const [ks] = this.data;
        return [bisect(ks, start, arrayCmp), bisect(ks, end, arrayCmp)];
    }

    rightRange<K extends any[], T>(start: K, end: K): [number, number] {
        const [ks] = this.data;
        return [bisect(ks, start.concat(null), arrayCmp), bisect(ks, end.concat(null), arrayCmp)];
    }

    slice([l, r]: [number, number]): T[] {
        const [_, ts] = this.data;
        return ts.slice(l, r);
    }

    sliceMatching(start: any[], end: any[]): T[] {
        return this.slice(this.range(start, end));
    }
}

export function recursivelyInstallData<T>(dest: T, src: T) {
    for (let k in src) {
        const n = src[k]
        if (typeof n === "object") {
            if (n != null && !Array.isArray(n)) {
                recursivelyInstallData(dest[k], n);
                continue;
            }
        }

        dest[k] = n;
    }
}

export function recursivelyExtractData<T>(v: T): T {
    const result: any = {};
    for (let k in v) {
        const n = v[k];
        if (typeof n === "object") {
            if (n != null && !Array.isArray(n)) {
                result[k] = recursivelyExtractData<any>(n);
                continue;
            }
        } else if (typeof n === "function") {
            continue;
        }

        result[k] = n;
    }

    return result;
}

export class IndexedTable<T, PK extends any[], Indexes extends {[k: string]: Index<any, T>} = {}> {
    constructor(
        public pkMapper: (v: T) => PK,
        public indexes: Indexes,
        public pkIndex: Index<PK, T> = new Index(),
        private keyMappers: {[k: string]: (v: T) => any[]} = {},
    ) {}

    dup(): IndexedTable<T, PK, Indexes> {
        return new IndexedTable<T, PK, Indexes>(
            this.pkMapper,
            {...this.indexes},
            this.pkIndex,
            this.keyMappers,
        )
    }

    addIndex<K extends any[], O extends {[k: string]: any}>(o: O, mapper: (v: T) => K): IndexedTable<T, PK, Indexes & {[k in keyof O]: Index<K, T>}> {
        const newIndexes: any = {...this.indexes};
        const newKeyMappers: any = {...this.keyMappers};

        Object.entries(o).forEach(([k, v]) => {
            newIndexes[k] = new Index()
            newKeyMappers[k] = mapper;
        })

        return new IndexedTable<T, PK, Indexes & {[k in keyof O]: Index<K, T>}>(
            this.pkMapper,
            newIndexes,
            this.pkIndex,
            newKeyMappers,
        )
    }

    insert(...ts: T[]) {
        const pkIndex = this.pkIndex = this.pkIndex.dup();

        for (let t of ts) {
            const pk = this.pkMapper(t);

            const [l, r] = pkIndex.range(pk, [...pk, null]);
            pkIndex.data[1].splice(l, r - l, t);

            const {indexes, keyMappers} = this;
            for (let k in indexes) {
                const key = [...keyMappers[k](t), ...pk];
                const index: Index<any, T> = indexes[k] = indexes[k].dup() as any;
                const [l, r] = index.range(key, [...key, null]);
                index.data[0].splice(l, r - l, key);
                index.data[1].splice(l, r - l, t);
            }
        }
    }

    remove(pk: PK) {
        const [l, r] = this.pkIndex.range(pk, [...pk, null]);
        const pkIndex = this.pkIndex = this.pkIndex.dup();
        const t = pkIndex.data[1].splice(l, r - l)[0];
        if (!t) return;
        pkIndex.data[0].splice(l, r - l);

        const {indexes, keyMappers} = this;
        for (let k in indexes) {
            const key = [...keyMappers[k](t), ...pk];
            const index: Index<any, T> = indexes[k] = indexes[k].dup() as any;
            const [l, r] = index.range(key, [...key, null]);
            index.data[0].splice(l, r - l);
            index.data[1].splice(l, r - l);
        }
    }
}