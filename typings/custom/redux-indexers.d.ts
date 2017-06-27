declare module "redux-indexers" {
  export function bisect<T, E>(array: T[], e: E, cmp: (a: E, b: T) => number): number;

  export function arrayCmp(a: any[], b: any[]): number;

  export function numberCmp(a: number, b: number): number;

  export type Entry<V> = [any[], V];
  export type Index<V> = Entry<V>[];
  export type IndexStore<V> = { [k: string]: Index<V> }
  export type Keyer<V> = (v: V) => any[];
  export type IndexIterator<V> = () => V | 0
  export type GroupReducer<V> = (iter: IndexIterator<V>, reverseIter: IndexIterator<V>) => V | 0

  export class Indexer<V, I extends IndexStore<V>> {
    constructor(mainIndexName: keyof I);

    addIndex(attr: keyof I, keyer: Keyer<V>): void;

    addGroupedIndex(attr: keyof I,
                    keyer: Keyer<V>,
                    groupAttr: keyof I,
                    groupKeyer: Keyer<V>,
                    reducer: GroupReducer<V>): void;

    matchesInitialState(initialState: I): boolean;

    empty(): I;

    removeAll(indexes: I, values: V[]): I

    removeByPk(indexes: I, primaryKey: any[]): I;

    update(indexes: I, values: V[]): I;

    static iterator<V>(index: Index<V>, startKey?: any[], endKey?: any[]): IndexIterator<V>;

    static reverseIter<V>(index: Index<V>, startKey?: any[], endKey?: any[]): IndexIterator<V>;

    static getAllMatching<V>(index: Index<V>, key: any[]): V[];

    getByPk(indexes: I, key: any[]): V | 0;

    static getRangeFrom(index: Index<any>, startKey?: any[], endKey?: any[]): { startIndx: number, endIdx: number }

    static getFirstMatching<V>(index: Index<V>, key: any[]): V | 0;
  }
}