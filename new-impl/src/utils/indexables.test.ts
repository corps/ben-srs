import {Index} from "./indexable";

describe('indexables', () => {
    const base = new Index<[string, number], number>();
    base.insert(["b", 2], 3);
    base.insert(["b", 1], 2);
    base.insert(["a", 1], 1);
    base.insert(["c", 4], 4);

    describe('finding data in order', () => {
        it('supports forward ordering', () => {
            const index = base.dup();
            expect(index.slice(["b"], ["b", Infinity])).toEqual([2, 3]);
            expect(index.slice(["b"], ["c"])).toEqual([2, 3]);
            expect(index.slice(["b", 2], ["c", 4, null])).toEqual([3, 4]);
        })
    })
})