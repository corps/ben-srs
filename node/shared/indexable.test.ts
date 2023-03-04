import {cmpAny, IndexIterator, iterateKeyedTree, key, KeyedTree, makeKeyedTree} from "./indexable";
import {Tuple} from "./tuple";
import {mapSome} from "./maybe";

describe("KeyedTree", () => {
    const data: number[] = [];
    for (let i = 0; i < 10; ++i) {
        data.push(i);
    }
    const keyer = (v: number) => Tuple.from(v, v);
    const keyed = key(data, keyer);
    const baseTree = makeKeyedTree(Tuple.from(Tuple.from(-Infinity, -Infinity), -Infinity), keyed)

    describe('makeKeyedTree', () => {
        it("creates a sane tree", () => {
            let cnt = 0;
            function checkTree(tree: KeyedTree<Tuple<number, number>, number>) {
                cnt += 1;
                const [node, children] = tree;
                const [left, right] = children;
                mapSome(left, left => {
                    expect(cmpAny(node[0], left[0][0])).toEqual(1)
                    checkTree(left);
                })
                mapSome(right, right => {
                    expect(cmpAny(node[0], right[0][0])).toEqual(-1)
                    checkTree(right);
                })
            }
            checkTree(baseTree)
            expect(cnt).toEqual(keyed.length + 1)
        })
    })

    describe('iterateKeyedTree', () => {
        it("works without range", () => {
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree)))
                .toEqual([[[-Infinity, -Infinity], -Infinity], ...keyed])
        });

        it("works with contained range", () => {
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [3.5, 3.5], [7, 7])))
                .toEqual(key([4, 5, 6], keyer))
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [3, 3], [7, 7])))
                .toEqual(key([3, 4, 5, 6], keyer))
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [3, 3], [6.1, 6.1])))
                .toEqual(key([3, 4, 5, 6], keyer))
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [3, 3], [5.9, 5.9])))
                .toEqual(key([3, 4, 5], keyer))
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [-1, -1], [7, 7])))
                .toEqual(key([0, 1, 2, 3, 4, 5, 6], keyer))
        });

        it("works without contained range", () => {
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [-10, -10], [0, 0])))
                .toEqual(key([], keyer))
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [10, 10] )))
                .toEqual(key([], keyer))
        });
    })

    describe('iterateKeyedTree (reversed)', () => {
        it("works without range", () => {
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [Infinity, Infinity], -Infinity as any, true)))
                .toEqual([[[-Infinity, -Infinity], -Infinity], ...keyed].reverse())
        });

        it("works with contained range", () => {
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [7, 7], [3.5, 3.5], true)))
                .toEqual(key([4, 5, 6, 7], keyer).reverse())
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [7, 7], [3, 3], true)))
                .toEqual(key([4, 5, 6, 7], keyer).reverse())
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree,  [6.1, 6.1], [3, 3], true)))
                .toEqual(key([4, 5, 6], keyer).reverse())
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [7, 7], [-1, -1], true)))
                .toEqual(key([0, 1, 2, 3, 4, 5, 6, 7], keyer).reverse())
        });

        it("works without contained range", () => {
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [-10, -10], [0, 0])))
                .toEqual(key([], keyer))
            expect(IndexIterator.toArray(iterateKeyedTree(baseTree, [10, 10] )))
                .toEqual(key([], keyer))
        });
    })
})