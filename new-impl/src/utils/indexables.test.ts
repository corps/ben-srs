import {Index} from "./indexable";

describe('indexables', () => {
    const base = new Index<[string, number], number>();
    base.insert(["b", 2], 3);
    base.insert(["b", 1], 2);
    base.insert(["a", 1], 1);
    base.insert(["c", 4], 4);

    describe('removing and finding data', () => {
        it('works', () => {
            const index = base.dup();
            expect(index.find(["b", 3])).toEqual(null);
            expect(index.find(["a", 1])).toEqual([1]);
            expect(index.remove(["b", 3]))
            expect(index.length).toEqual(4);
            expect(index.remove(["a", 1]))
            expect(index.find(["a", 1])).toEqual(null);
        })
    });

    describe('finding data in order', () => {
        it('supports forward ordering', () => {
            const index = base.dup();
            expect(index.slice(index.range(["b"], ["b", Infinity]))).toEqual([2, 3]);
            expect(index.slice(index.range(["b"], ["c"]))).toEqual([2, 3]);
            expect(index.slice(index.range(["b", 2], ["c", 4, null]))).toEqual([3, 4]);
            expect(index.slice(index.range([], ["c", 4, null]))).toEqual([1, 2, 3, 4]);
        })
        
      it('supports reverse ordering', () => {
          const index = base.dup();
          expect(index.slice(index.rightRange(["b"], ["b", Infinity])).reverse()).toEqual([3, 2]);
          expect(index.slice(index.rightRange(["b"], ["b", Infinity])).reverse()).toEqual([3, 2]);
          expect(index.slice(index.rightRange(["b"], ["c"])).reverse()).toEqual([3, 2]);
          expect(index.slice(index.rightRange([], ["c", 4, null])).reverse()).toEqual([4, 3, 2, 1]);
      })
    })
})