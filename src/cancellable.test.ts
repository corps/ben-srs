import {Cancellable, runAsync} from "./cancellable";
import {mapSome, some} from "./utils/maybe";
import {delay} from "./utils/delay";

describe('cancellable', () => {
    describe('iocRun', () => {
        let cancellable: Cancellable;
        let markers: number[];

        beforeEach(() => {
            markers = [];
            cancellable = new Cancellable();
            expect(markers).toEqual([]);
        })

        describe('runs with async errors', () => {
            function run() {
                return cancellable.iocRun(function* () {
                    yield* runAsync(async () => 1)
                    yield* runAsync<number>(async () => { throw Error('oh no') })
                }())
            }

            it('works', async () => {
                const [gen, result] = run();
                for (let el of gen) {
                    const val = await el;
                    expect(val).toEqual(some(1));
                    for (let el of gen) {
                        const val = await el;
                        expect(val).toEqual(null);
                    }
                }

                try {
                    await result;
                    throw new Error('Expected failure')
                } catch (e) {
                    expect(e.toString()).toEqual('Error: oh no')
                }
            })
        })

        describe('runs with generator errors', () => {
            function run() {
                return cancellable.iocRun(function* () {
                    yield* runAsync(async () => 1)
                    throw new Error('oh no');
                }())
            }

            it('works', async () => {
                const [gen, result] = run();
                for (let el of gen) {
                    const val = await el;
                    expect(val).toEqual(some(1));
                    for (let el of gen) {
                        const val = await el;
                        expect(val).toEqual(null);
                    }
                }

                try {
                    await result;
                    throw new Error('Expected failure')
                } catch (e) {
                    expect(e.toString()).toEqual('Error: oh no')
                }
            })
        })

        describe('successful runs', () => {
            function run() {
                return cancellable.iocRun(function* () {
                    markers.push(0);
                    yield* runAsync(async () => 1)
                    markers.push(1);
                    yield* runAsync(async () => 2)
                    markers.push(2);
                    yield* runAsync(async () => 3)
                    markers.push(3);
                    return "yup"
                }())
            }

            it('can be cancelled before any generator code is run', async () => {
                expect(markers).toEqual([]);
                const [gen, result] = run();
                expect(markers).toEqual([]);
                cancellable.cancel();

                for (let el of gen) {
                    await el;
                }

                const value = await result;
                expect(value).toEqual(null);
                expect(markers).toEqual([]);
            })

            it('handles cancels post iteration but pre resolution', async () => {
                const [gen, result] = run();

                for (let el of gen) {
                    cancellable.cancel()
                    const result = await el;
                    expect(result).toEqual(null);
                }

                const value = await result;
                expect(value).toEqual(null);
                expect(markers).toEqual([]);
            })

            it('does not buffer results, allowing cancellation to fully nullify future results', async () => {
                const [gen, result] = run();

                for (let el of gen) {
                    await delay(1000);
                    cancellable.cancel()
                    const result = await el;
                    expect(result).toEqual([1]);
                }

                const value = await result;
                expect(value).toEqual(null);
                expect(markers).toEqual([0]);
            })

            it('fully consumes data', async () => {
                const [gen, result] = run();
                const yields: number[] = [];

                for (let el of gen) {
                    const result = await el;
                    mapSome(result, v => yields.push(v));
                }

                const value = await result;
                expect(value).toEqual(["yup"]);
                expect(markers).toEqual([0, 1, 2, 3]);
                expect(yields).toEqual([1, 2, 3]);
            })
        })
    })
})