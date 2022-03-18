import 'regenerator-runtime';
import {mapSome, Maybe, some} from "./maybe";

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

export type Indexed<T> = [any[], T[]];
export type IndexStore<T> = {[k: string]: Indexed<T>}
export type Keyers<T> = {[k: string]: Keyer<T>};
export type Keyer<V> = (v: V) => any[];
export type IndexIterator<V> = () => Maybe<V>
export type GroupReducer<V> = (iter: IndexIterator<V>, reverseIter: IndexIterator<V>) => Maybe<V>
export type Reducers<V> = {[k: string]: GroupReducer<V>};

export function debugIterator<A>(label: string, iterable: IndexIterator<A>): IndexIterator<A> {
    const data: A[] = [];
    while (true) {
        const next = iterable();
        if (next) {
            data.push(next[0])
        } else {
            break;
        }
    }
    console.log({[label]: data});
    return asIterator(data);
}

export function asIterator<A>(iterable: Iterable<A>): IndexIterator<A> {
    const iter = iterable[Symbol.iterator]()
    return () => {
        const next = iter.next();
        if (next.done) {
            return null;
        }

        return some(next.value);
    }
}

export function mapIndexIterator<A, B>(iterator: IndexIterator<A>, f: (a: A) => B): IndexIterator<B> {
    return () => mapSome(iterator(), f);
}

export function flatMapIndexIterator<A, B>(iterator: IndexIterator<A>, f: (a: A) => IndexIterator<B>): IndexIterator<B> {
    let cur: Maybe<IndexIterator<B>> = null;
    return () => {
        while (true) {
            if (!cur) {
                cur = mapSome(iterator(), f);
                if (!cur) break;
            }

            const next = cur[0]();
            if (next) return next;
            else cur = null;
        }

        return null;
    }
}

export function filterIndexIterator<A>(iterator: IndexIterator<A>, f: (a: A) => boolean): IndexIterator<A> {
    return () => {
        let next = iterator();
        while (next && !f(next[0])) next = iterator();
        return next;
    }
}

export function flattenIndexIterator<A>(iterator: IndexIterator<Maybe<A>>): IndexIterator<A> {
    return () => {
        while (true) {
            const next = iterator();
            if (!next) return null;
            if (next[0]) return next[0];
        }
    }
}

export function chainIndexIterators<A>(...iterators: IndexIterator<A>[]) {
    let i = 0;

    return () => {
        while (i < iterators.length) {
            const iterator = iterators[i];

            const next = iterator();
            if (next) {
                return next;
            }

            ++i;
        }

        return null;
    }
}

export class Indexer<V, I extends IndexStore<V>> {
    constructor(
        private mainIndexName: keyof I,
        private indexKeyers: Keyers<V> = {},
        private indexDependentGroup: { [k: string]: keyof I } = {},
        private indexGroupKeyers:  Keyers<V> = {},
        private indexReducers: Reducers<V> = {},
    ) {
    }

    get pkKeyer(): Keyer<V> {
        return this.indexKeyers[this.mainIndexName as string];
    }

    setKeyer(attr: keyof I, keyer: Keyer<V>) {
        this.indexKeyers[attr as string] = keyer;
    }

    addGroupedIndex(attr: keyof I,
                    keyer: Keyer<V>,
                    groupAttr: keyof I,
                    groupKeyer: Keyer<V>,
                    reducer: GroupReducer<V>) {
        if (!this.indexKeyers[groupAttr as string]) {
            throw new Error("Dependent index " + groupAttr + " should be defined before " + attr);
        }

        this.setKeyer(attr, keyer);

        this.indexDependentGroup[attr as string] = groupAttr;
        this.indexGroupKeyers[attr as string] = groupKeyer;
        this.indexReducers[attr as string] = reducer;
    }

    empty(): I {
        let result = {} as I;
        for (let k in this.indexKeyers) {
            (result as any)[k] = [[], []];
        }

        return result;
    }

    removeAll(indexes: I, values: V[]) {
        return this.splice(indexes, values, []);
    }

    removeByPk(indexes: I, primaryKey: any[]): I {
        return this.removeAll(indexes, Indexer.getAllMatching(indexes[this.mainIndexName], primaryKey));
    }

    update(indexes: I, values: V[]): I {
        let oldValues = [] as V[];
        let newValues = [] as V[];

        let [uniqueKeys, uniqueValues] = uniqueIndex<V>(this.indexKeyers[this.mainIndexName as string], values);
        uniqueValues.forEach((v, i) => {
            let existing = Indexer.getFirstMatching(indexes[this.mainIndexName], uniqueKeys[i]);
            mapSome(existing, existing => oldValues.push(existing));
            newValues.push(v);
        });

        return this.splice(indexes, oldValues, newValues);
    }

    static iterator<V>(index: Indexed<V>, startKey: any[] | null = null, endKey: any[] | null = null): IndexIterator<V> {
        const {startIdx, endIdx} = Indexer.getRangeFrom(index, startKey, endKey);
        let idx = startIdx;

        return () => {
            if (idx < endIdx) {
                return some(index[1][idx++]);
            }
            return null;
        }
    }

    static reverseIter<V>(index: Indexed<V>, startKey: any[] | null = null, endKey: any[] | null = null): IndexIterator<V> {
        if (startKey) startKey = endKeyMatchingOnly(startKey);
        if (endKey) endKey = endKeyMatchingOnly(endKey);

        let {startIdx, endIdx} = Indexer.getRangeFrom(index, endKey, startKey);
        let idx = endIdx;

        return () => {
            if (idx > startIdx) {
                return some(index[1][--idx]);
            }
            return null;
        }
    }

    static getAllMatching<V>(index: Indexed<V>, key: any[]): V[] {
        let {startIdx, endIdx} = Indexer.getRangeFrom(index, key, endKeyMatchingWithin(key));
        return index[1].slice(startIdx, endIdx);
    }

    static getRangeFrom([ks]: Indexed<any>, startKey: any[] | null = null, endKey: any[] | null = null) {
        let startIdx: number;
        let endIdx: number;

        if (startKey == null) {
            startIdx = 0;
        } else {
            startIdx = bisect(ks, startKey, arrayCmp);
        }

        if (endKey == null) {
            endIdx = ks.length;
        } else {
            endIdx = bisect(ks, endKey, arrayCmp);
        }

        return {startIdx, endIdx};
    }

    static getFirstMatching<V>(index: Indexed<V>, key: any[]): Maybe<V> {
        return Indexer.iterator(index, key, endKeyMatchingWithin(key))();
    }

    private splice(indexes: I, removeValues: V[], addValues: V[]) {
        const oldIndexes = indexes;
        if (!removeValues.length && !addValues.length) {
            return indexes;
        }

        indexes = {...(indexes as any)};

        for (let indexName of Object.keys(this.indexKeyers)) {
            let index = indexes[indexName];
            let valuesToRemove = removeValues;
            let valuesToAdd = addValues;

            const groupIndexName = this.indexDependentGroup[indexName];
            if (groupIndexName) {
                let groupKeyer = this.indexGroupKeyers[indexName];
                let reducer = this.indexReducers[indexName];

                let updateGroups = uniqueIndex(groupKeyer, [...valuesToRemove, ...valuesToAdd]);
                valuesToRemove = [];
                valuesToAdd = [];

                for (let updateGroupKey of updateGroups[0]) {
                    const prevGroupIndex = oldIndexes[groupIndexName];
                    const updateGroupKeyRight = endKeyMatchingWithin(updateGroupKey);
                    let iter = Indexer.iterator(prevGroupIndex,
                        updateGroupKey,
                        updateGroupKeyRight);
                    let reverseIter = Indexer.reverseIter(prevGroupIndex,
                        updateGroupKeyRight,
                        updateGroupKey);
                    const remove = reducer(iter, reverseIter);

                    const curGroupIndex = indexes[groupIndexName];
                    iter = Indexer.iterator(curGroupIndex,
                        updateGroupKey,
                        updateGroupKeyRight);
                    reverseIter = Indexer.reverseIter(curGroupIndex,
                        updateGroupKeyRight,
                        updateGroupKey);
                    const add = reducer(iter, reverseIter);

                    if (remove === add) continue;
                    mapSome(remove, remove => valuesToRemove.push(remove));
                    mapSome(add, add => valuesToAdd.push(add));
                }
            }

            if (!valuesToAdd.length && !valuesToRemove.length) {
                continue;
            }

            index = (indexes as any)[indexName] = [[...index[0]], [...index[1]]] as Indexed<V>;

            for (let value of valuesToRemove) {
                this.removeFromIndex(index, indexName, value);
            }

            for (let value of valuesToAdd) {
                this.addToIndex(index, indexName, value);
            }
        }

        return indexes;
    }

    private strictValueKeyOf(indexName: keyof I, value: V): any[] {
        let pk = this.indexKeyers[this.mainIndexName as string](value);

        if (indexName === this.mainIndexName) {
            return pk;
        }

        return [...this.indexKeyers[indexName as string](value), ...pk]
    }

    private addToIndex(index: Indexed<V>, indexName: keyof I, v: V) {
        const key = this.strictValueKeyOf(indexName, v);
        const {startIdx} = Indexer.getRangeFrom(index, key);
        index[0].splice(startIdx, 0, key);
        index[1].splice(startIdx, 0, v);
    }

    private removeFromIndex(index: Indexed<any>, indexName: keyof I, v: V) {
        const key = this.strictValueKeyOf(indexName, v);
        const {startIdx, endIdx} = Indexer.getRangeFrom(index, key, endKeyMatchingOnly(key));
        index[0].splice(startIdx, endIdx - startIdx);
        index[1].splice(startIdx, endIdx - startIdx);
    }
}

function uniqueIndex<V>(keyer: Keyer<V>, values: V[], index = [[], []] as Indexed<V>): Indexed<V> {
    for (let value of values) {
        let key = keyer(value);
        let {startIdx, endIdx} = Indexer.getRangeFrom(index, key, endKeyMatchingOnly(key));
        index[0].splice(startIdx, endIdx - startIdx, key);
        index[1].splice(startIdx, endIdx - startIdx, value);
    }

    return index;
}

export function endKeyMatchingOnly(start: any[]): any[] {
    return [...start, null];
}

export function endKeyMatchingWithin(start: any[]): any[] {
    return [...start, Infinity];
}