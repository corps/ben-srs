import 'regenerator-runtime';
import {mapSome, Maybe, some, withDefault} from './maybe';
import {Tuple} from "./tuple";


export type KeyedNode<K, T> = [identity: K, value: T];
export interface KeyedTree<K, T> extends Tuple<KeyedNode<K, T>, Tuple<Maybe<KeyedTree<K, T>>, Maybe<KeyedTree<K, T>>>> {}
export function key<K, T>(values: T[], keyer: (v: T) => K): KeyedNode<K, T>[] {
  const result = values.map(v => Tuple.from(keyer(v), v));
  result.sort(cmpAny);
  return result;
}

export function makeKeyedTree<K, T>(root: KeyedNode<K, T>, sortedNodes: KeyedNode<K, T>[]): KeyedTree<K, T> {
  function _makeKeyedTree(l: number = 0, r: number = sortedNodes.length): Maybe<KeyedTree<K, T>> {
    const i = (l + r) >>> 1;
    if (i >= r) return null;
    const leftTree = _makeKeyedTree(l, i)
    const rightTree = _makeKeyedTree(i + 1, r)
    return some(Tuple.from(sortedNodes[i], Tuple.from(leftTree, rightTree)));
  }

  const children = _makeKeyedTree();
  if (children) {
    const cmp = cmpAny(children[0][0], root[0]);
    if (cmp < 0) {
      return Tuple.from(root, Tuple.from(children, null))
    }
    if (cmp > 0) {
      return Tuple.from(root, Tuple.from(null, children))
    }

    return children[0];
  }

  return Tuple.from(root, Tuple.from(null, null))
}

export function insertKeyedTree<K, T>(tree: KeyedTree<K, T>, node: KeyedNode<K, T>): KeyedTree<K, T> {
  const [root, children] = tree;
  const cmp = cmpAny(node[0], root[0]);
  if (cmp === 0) return Tuple.from(node, children);
  if (cmp < 0) {
    return Tuple.from(root, Tuple.from(mapSome(children[0], left => insertKeyedTree(left, node)), children[1]));
  }
  return Tuple.from(root, Tuple.from(children[0], mapSome(children[1], right => insertKeyedTree(right, node))));
}

function increasing<K, T>(tree: KeyedTree<K, T>): Tuple<Maybe<KeyedTree<K, T>>, Maybe<KeyedTree<K, T>>> {
  return tree[1];
}

function decreasing<K, T>(tree: KeyedTree<K, T>): Tuple<Maybe<KeyedTree<K, T>>, Maybe<KeyedTree<K, T>>> {
  const [l, r] = tree[1];
  return [r, l];
}

function takeChildren<K, T>(c: Tuple<Maybe<KeyedTree<K, T>>, Maybe<KeyedTree<K, T>>>, reverse=false) {
  if (reverse) {
    return [c[1], c[0]];
  }

  return c;
}

// Find the smallest tree such that the next tree key is >= K
export function bisectKeyedTree<K, T>(tree: KeyedTree<K, T>, key: K, reverse=false): Tuple<KeyedTree<K, T>[], KeyedTree<K, T>> {
  const parents: KeyedTree<K, T>[] = [];
  const cmpFactor = reverse ? -1 : 1;
  while (true) {
    const [_, children] = tree;
    const [l, r] = takeChildren(children, reverse);


    const cmpRoot = cmpAny(key, tree[0][0]) * cmpFactor;

    if (r) {
      if (cmpRoot > 0) {
        parents.push(tree);
        tree = r[0];
        continue;
      }
    }
    if (l) {
      if (cmpRoot <= 0) {
        parents.push(tree);
        tree = l[0];
        continue;
      }
    }

    break;
  }

  return Tuple.from(parents, tree);
}

export function iterateKeyedTree<K, T>(tree: KeyedTree<K, T>, startKey: K = -Infinity as K, endKey: K = Infinity as K, reverse=false): IndexIterator<KeyedNode<K, T>> {
  const cmpFactor = reverse ? -1 : 1;
  let dead = false;
  const [parents, treeStart] = bisectKeyedTree(tree, startKey, reverse);
  const [_, treeEnd] = bisectKeyedTree(tree, endKey, reverse);
  tree = treeStart;

  if (cmpAny(treeEnd[0][0], endKey) * cmpFactor >= 0) return () => null;
  if (cmpAny(treeStart[0][0], startKey) * cmpFactor < 0) {
    iter();
  }

  return iter;

  function iter() {
    if (dead) return null;
    const last = tree;
    const n = findNext();
    if (n) {
      tree = n[0];
    } else {
      dead = true;
    }

    if (last == treeEnd) dead = true;
    return some(last[0]);
  }

  function parent(): Maybe<KeyedTree<K, T>> {
    if (parents.length) {
      return some(parents[parents.length - 1]);
    }
    return null;
  }

  function findNext(): Maybe<KeyedTree<K, T>> {
    let [_, children] = tree;
    const [__, right] = takeChildren(children, reverse);
    if (right) {
      parents.push(tree);
      tree = right[0];
      return findLeft();
    } else {
      for (let p = parent(); p && withDefault(mapSome(takeChildren(p[0][1], reverse)[1], rightTree => rightTree === tree), false); p = parent()) {
        parents.pop();
        tree = p[0];
      }

      const n = parent();
      if (n) {
        parents.pop();
        tree = n[0];
      }
      return n;
    }
  }

  function findLeft(): Maybe<KeyedTree<K, T>> {
    for (let left = takeChildren(tree[1], reverse)[0]; left; left = takeChildren(tree[1], reverse)[0]) {
      parents.push(tree);
      tree = left[0];
    }
    return some(tree);
  }
}

export function cmpAny(aVal: any, bVal: any) {
  if (aVal === bVal) return 0;
  if (bVal === Infinity) return -1;
  if (aVal === Infinity) return 1;
  if (aVal == null || aVal == -Infinity) return -1;
  if (bVal == null || bVal == -Infinity) return 1;

  if (Array.isArray(aVal)) {
    if (Array.isArray(bVal)) {
      return arrayCmp(aVal, bVal);
    }
    return -1;
  } else if(Array.isArray(bVal)) {
    return 1;
  }

  if (aVal < bVal) return -1;
  return 1;
}

export function arrayCmp(a: ReadonlyArray<any>, b: ReadonlyArray<any>): number {
  for (let i = 0; i < a.length && i < b.length; ++i) {
    let aVal = a[i];
    let bVal = b[i];

    const cmp = cmpAny(aVal, bVal);
    if (cmp === 0) continue;
    return cmp;
  }

  if (a.length === b.length) return 0;
  if (a.length > b.length) return 1;
  return -1;
}

export function bisect<T, E>(
  array: ReadonlyArray<T>,
  e: E,
  cmp: (a: E, b: T) => number,
  l = 0,
  r = array.length
) {
  let mid: number;
  let c: number;

  while (l < r) {
    mid = (l + r) >>> 1;
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
export type IndexStore<T> = { [k: string]: Indexed<T> };
export type Keyers<T> = { [k: string]: Keyer<T> };
export type Keyer<V> = (v: V) => any[];
export type IndexIterator<V> = () => Maybe<V>;
export type GroupReducer<V> = (
  iter: IndexIterator<V>,
  reverseIter: IndexIterator<V>
) => Maybe<V>;
export type Reducers<V> = { [k: string]: GroupReducer<V> };


export function debugIterator<A>(
  label: string,
  iterable: IndexIterator<A>
): IndexIterator<A> {
  const data: A[] = [];
  while (true) {
    const next = iterable();
    if (next) {
      data.push(next[0]);
    } else {
      break;
    }
  }
  console.log({ [label]: data });
  return asIterator(data);
}

export function asIterator<A>(iterable: Iterable<A>): IndexIterator<A> {
  const iter = iterable[Symbol.iterator]();
  return () => {
    const next = iter.next();
    if (next.done) {
      return null;
    }

    return some(next.value);
  };
}

export function mapIndexIterator<A, B>(
  iterator: IndexIterator<A>,
  f: (a: A) => B
): IndexIterator<B> {
  return () => mapSome(iterator(), f);
}

export function concatIndexIterators<A>(
  ...iterators: IndexIterator<A>[]
): IndexIterator<A> {
  let i = 0;
  return () => {
    while (i < iterators.length) {
      const next = iterators[i]();
      if (next) return next;
      else ++i;
    }

    return null;
  };
}

export function flatMapIndexIterator<A, B>(
  iterator: IndexIterator<A>,
  f: (a: A) => IndexIterator<B>
): IndexIterator<B> {
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
  };
}

export function filterIndexIterator<A>(
  iterator: IndexIterator<A>,
  f: (a: A) => boolean
): IndexIterator<A> {
  return () => {
    let next = iterator();
    while (next && !f(next[0])) next = iterator();
    return next;
  };
}

export function flattenIndexIterator<A>(
  iterator: IndexIterator<Maybe<A>>
): IndexIterator<A> {
  return () => {
    while (true) {
      const next = iterator();
      if (!next) return null;
      if (next[0]) return next[0];
    }
  };
}

export function peekIndexIterator<A>(iterator: IndexIterator<A>): Tuple<Maybe<A>, IndexIterator<A>> {
  const next = iterator();
  let consumed = false;
  return Tuple.from(
    next,
    chainIndexIterators(() => {
      if (consumed) return null;
      consumed = true;
      return next;
    }, iterator)
  )
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
  };
}

export function indexIteratorToArray<A>(iterator: IndexIterator<A>): A[] {
  const result: A[] = [];
  for (let cur = iterator(); cur; cur = iterator()) {
    result.push(cur[0]);
  }
  return result;
}

export const IndexIterator = {
  toArray: indexIteratorToArray,
  chain: chainIndexIterators, flatten: flattenIndexIterator, filter: filterIndexIterator, flatMap: flatMapIndexIterator, concat: concatIndexIterators, map: mapIndexIterator, from: asIterator
}

export class Indexer<V, I extends IndexStore<V>> {
  constructor(
    private mainIndexName: keyof I,
    private indexKeyers: Keyers<V> = {},
    private indexDependentGroup: { [k: string]: keyof I } = {},
    private indexGroupKeyers: Keyers<V> = {},
    private indexReducers: Reducers<V> = {}
  ) {}

  get pkKeyer(): Keyer<V> {
    return this.indexKeyers[this.mainIndexName as string];
  }

  setKeyer(attr: keyof I, keyer: Keyer<V>) {
    this.indexKeyers[attr as string] = keyer;
  }

  addGroupedIndex(
    attr: keyof I,
    keyer: Keyer<V>,
    groupAttr: keyof I,
    groupKeyer: Keyer<V>,
    reducer: GroupReducer<V>
  ) {
    if (!this.indexKeyers[groupAttr as string]) {
      throw new Error(
        `Dependent index ${String(groupAttr)} should be defined before ${String(
          attr
        )}`
      );
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
    return this.removeAll(
      indexes,
      Indexer.getAllMatching(indexes[this.mainIndexName], primaryKey)
    );
  }

  update(indexes: I, values: V[]): I {
    let oldValues = [] as V[];
    let newValues = [] as V[];

    let [uniqueKeys, uniqueValues] = uniqueIndex<V>(
      this.indexKeyers[this.mainIndexName as string],
      values
    );
    uniqueValues.forEach((v, i) => {
      let existing = Indexer.getFirstMatching(
        indexes[this.mainIndexName],
        uniqueKeys[i]
      );
      mapSome(existing, (existing) => oldValues.push(existing));
      newValues.push(v);
    });

    return this.splice(indexes, oldValues, newValues);
  }

  static iterator<V>(
    index: Indexed<V>,
    startKey: any[] | null = null,
    endKey: any[] | null = null
  ): IndexIterator<V> {
    const { startIdx, endIdx } = Indexer.getRangeFrom(index, startKey, endKey);
    let idx = startIdx;

    return () => {
      if (idx < endIdx) {
        return some(index[1][idx++]);
      }
      return null;
    };
  }

  static reverseIter<V>(
    index: Indexed<V>,
    startKey: any[] | null = null,
    endKey: any[] | null = null
  ): IndexIterator<V> {
    if (startKey) startKey = endKeyMatchingOnly(startKey);
    if (endKey) endKey = endKeyMatchingOnly(endKey);

    let { startIdx, endIdx } = Indexer.getRangeFrom(index, endKey, startKey);
    let idx = endIdx;

    return () => {
      if (idx > startIdx) {
        return some(index[1][--idx]);
      }
      return null;
    };
  }

  static getAllMatching<V>(index: Indexed<V>, key: any[]): V[] {
    let { startIdx, endIdx } = Indexer.getRangeFrom(
      index,
      key,
      endKeyMatchingWithin(key)
    );
    return index[1].slice(startIdx, endIdx);
  }

  static getRangeFrom(
    [ks]: Indexed<any>,
    startKey: any[] | null = null,
    endKey: any[] | null = null
  ) {
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

    return { startIdx, endIdx };
  }

  static getFirstMatching<V>(index: Indexed<V>, key: any[]): Maybe<V> {
    return Indexer.iterator(index, key, endKeyMatchingWithin(key))();
  }

  private splice(indexes: I, removeValues: V[], addValues: V[]) {
    const oldIndexes = indexes;
    if (!removeValues.length && !addValues.length) {
      return indexes;
    }

    indexes = { ...(indexes as any) };

    for (let indexName of Object.keys(this.indexKeyers)) {
      let index = indexes[indexName];
      let valuesToRemove = removeValues;
      let valuesToAdd = addValues;

      const groupIndexName = this.indexDependentGroup[indexName];
      if (groupIndexName) {
        let groupKeyer = this.indexGroupKeyers[indexName];
        let reducer = this.indexReducers[indexName];

        let updateGroups = uniqueIndex(groupKeyer, [
          ...valuesToRemove,
          ...valuesToAdd
        ]);
        valuesToRemove = [];
        valuesToAdd = [];

        for (let updateGroupKey of updateGroups[0]) {
          const prevGroupIndex = oldIndexes[groupIndexName];
          const updateGroupKeyRight = endKeyMatchingWithin(updateGroupKey);
          let iter = Indexer.iterator(
            prevGroupIndex,
            updateGroupKey,
            updateGroupKeyRight
          );
          let reverseIter = Indexer.reverseIter(
            prevGroupIndex,
            updateGroupKeyRight,
            updateGroupKey
          );
          const remove = reducer(iter, reverseIter);

          const curGroupIndex = indexes[groupIndexName];
          iter = Indexer.iterator(
            curGroupIndex,
            updateGroupKey,
            updateGroupKeyRight
          );
          reverseIter = Indexer.reverseIter(
            curGroupIndex,
            updateGroupKeyRight,
            updateGroupKey
          );
          const add = reducer(iter, reverseIter);

          if (remove === add) continue;
          mapSome(remove, (remove) => valuesToRemove.push(remove));
          mapSome(add, (add) => valuesToAdd.push(add));
        }
      }

      if (!valuesToAdd.length && !valuesToRemove.length) {
        continue;
      }

      index = (indexes as any)[indexName] = [
        [...index[0]],
        [...index[1]]
      ] as Indexed<V>;

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

    return [...this.indexKeyers[indexName as string](value), ...pk];
  }

  private addToIndex(index: Indexed<V>, indexName: keyof I, v: V) {
    const key = this.strictValueKeyOf(indexName, v);
    const { startIdx } = Indexer.getRangeFrom(index, key);
    index[0].splice(startIdx, 0, key);
    index[1].splice(startIdx, 0, v);
  }

  private removeFromIndex(index: Indexed<any>, indexName: keyof I, v: V) {
    const key = this.strictValueKeyOf(indexName, v);
    const { startIdx, endIdx } = Indexer.getRangeFrom(
      index,
      key,
      endKeyMatchingOnly(key)
    );
    index[0].splice(startIdx, endIdx - startIdx);
    index[1].splice(startIdx, endIdx - startIdx);
  }
}

function uniqueIndex<V>(
  keyer: Keyer<V>,
  values: V[],
  index = [[], []] as Indexed<V>
): Indexed<V> {
  for (let value of values) {
    let key = keyer(value);
    let { startIdx, endIdx } = Indexer.getRangeFrom(
      index,
      key,
      endKeyMatchingOnly(key)
    );
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
