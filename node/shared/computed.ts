import {mapSome, Maybe, some} from "./maybe";
import {Tuple} from "./tuple";
import {Dispatch, SetStateAction} from "react";

export type Computed<Result, Root> = (cur: Root, prev: Maybe<Root>) => Result;

export function memoize<Result, Root>(
    c: Computed<Result, Root>,
    [v, setV]: Tuple<Maybe<Tuple<Root, Result>>, Dispatch<SetStateAction<Maybe<Tuple<Root, Result>>>>>,
): (c: Root) => Result {
    return function (cur) {
        if (v) {
            if (v[0][0] === cur) {
                return v[0][1];
            }
        }

        const result = c(cur, mapSome(v, v => v[0]));
        setV(some(Tuple.from(cur, result)))
        return result;
    }
}

export function mapComputed<A, B, Root>(a: Computed<A, Root>, f: (a: A) => B): Computed<B, Root> {
    return function computed(cur, prev) {
        return f(a(cur, prev));
    }
}

export function concatComputed<A, B, Root>(a: Computed<A, Root>, b: Computed<B, Root>): Computed<Tuple<A, B>, Root> {
    return function computed(cur, prev) {
        return [a(cur, prev), b(cur, prev)];
    }
}

export function applyComputed<Parameter, Result, Remainder, Root>(v: Tuple<Computed<(a: Parameter) => Result, Root>, Computed<Parameter, Root>>): Computed<Result, Root> {
    return function computed(cur, prev) {
        const f = v[0](cur, prev);
        const p = v[1](cur, prev);
        return f(p);
    }
}