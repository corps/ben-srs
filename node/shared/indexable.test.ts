import {cmpAny, IndexIterator, iterateKeyedTree, key, KeyedTree, makeKeyedTree} from "./indexable";
import {Tuple} from "./tuple";
import {mapSome} from "./maybe";

describe("KeyedTree", () => {
    const data: number[] = [];
    for (let i = 0; i < 10; ++i) {
        data.push(i);
    }
    const keyed = key(data, v => Tuple.from(v, v));
    const baseTree = makeKeyedTree(Tuple.from(Tuple.from(-Infinity, -Infinity), -Infinity), keyed)

    it("hi", () => {
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
        expect(cnt).toEqual(keyed.length)
    })

    it("makeKeyedTree works", () => {
        expect(IndexIterator.toArray(iterateKeyedTree(baseTree, Tuple.from(-Infinity, -Infinity), Tuple.from(Infinity, Infinity))))
            .toEqual([[[-Infinity, -Infinity], -Infinity], ...keyed])
    })
})