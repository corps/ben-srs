import 'regenerator-runtime';

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
        ts.splice(idx, 0);
        ks.splice(idx, 0);
    }

    range(start: any[], end: any[]): [number, number] {
        const [ks] = this.data;
        return [bisect(ks, start, arrayCmp), bisect(ks, end, arrayCmp)];
    }

    reverseRange<K extends any[], T>(start: K, end: K): [number, number] {
        const [ks] = this.data;
        return [bisect(ks, start.concat(null), arrayCmp), bisect(ks, end.concat(null), arrayCmp)];
    }

    slice(start: any[], end: any[]): T[] {
        const [_, ts] = this.data;
        const [l, r] = this.range(start, end);
        return ts.slice(l, r);
    }
}
