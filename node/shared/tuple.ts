export type Tuple<A, B> = [A, B]
export const Tuple = {
    from<A, B>(a: A, b: B): Tuple<A, B>  {
        return [a, b];
    },
    twice<A>(a: A): Tuple<A, A> {
        return [a, a];
    }
}