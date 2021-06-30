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
export type ReadOnlyIndexed<K extends any[], T> = Readonly<[ReadonlyArray<Readonly<K>>, ReadonlyArray<Readonly<T>>]>

export function modifyIndexed<K extends any[], T>(indexed: ReadOnlyIndexed<K, T>, transaction: (indexed: Indexed<K, T>) => void): ReadOnlyIndexed<K, T> {
    const mutable: Indexed<K, T> = [[...indexed[0]], [...indexed[1]]];
    transaction(mutable);
    return mutable;
}


export function insert<K extends any[], T>(k: K, t: T, [ks, ts]: Indexed<K, T>) {
    const idx = bisect(ks, k, arrayCmp);
    ts.splice(idx, 0, t);
    ks.splice(idx, 0, k);
}

export function remove<K extends any[], T>(k: K, [ks, ts]: Indexed<K, T>) {
    const idx = bisect(ks, k, arrayCmp);
    ts.splice(idx, 0);
    ks.splice(idx, 0);
}

export function range<K extends any[], T>([ks, ts]: ReadOnlyIndexed<K, T>, start: K, end: K): [number, number] {
    return [bisect(ks, start, arrayCmp), bisect(ks, end, arrayCmp)];
}

export function* iter<T>([_, ts]: ReadOnlyIndexed<any, T>, [l, r]: [number, number]): Iterator<T> {
    for (let i = l; i < r; ++i) yield ts[i];
}

export function* reverseIter<T>([_, ts]: ReadOnlyIndexed<any, T>, [l, r]: [number, number]): Iterator<T> {
    for (let i = r; i >= l; ++i) yield ts[i - 1];
}
