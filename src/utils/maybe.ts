export type Maybe<T> = null | [T];
export type Either<A, B> = {left: B} | {right: A};

export function zipSome<A>(a: Maybe<A>, b: Maybe<A>, f: (a: A, b: A) => A): Maybe<A> {
  if (a) {
    if (b) {
      return some(f(a[0], b[0]));
    }
    return a;
  }

  return b;
}

export function left<B, A = unknown>(left: B): Either<A, B> {
  return {left};
}

export function right<A, B = unknown>(right: A): Either<A, B> {
  return {right};
}

export function getLeft<A, B>(either: Either<A, B>): Maybe<B> {
  if ('left' in either) {
    return some(either.left);
  }
  
  return null;
}

export function getRight<A, B>(either: Either<A, B>): Maybe<A> {
  if ('right' in either) {
    return some(either.right);
  }
  
  return null;
}

export function withDefault<T>(v: Maybe<T>, d: T) {
  if (v == null) return d;
  return v[0];
}

export function isSome<T>(a: Maybe<T>): a is [T] {
  return a != null;
}

export function some<T>(v: T): Maybe<T> {
  return [v];
}

export function alternate<T>(a: Maybe<T>, ...alts: Maybe<T>[]): Maybe<T> {
  if (isSome(a)) return a;

  for(let alt of alts) {
    if (isSome(alt)) return alt;
  }

  return null;
}

export function fromVoid<T>(v: T | null | undefined): Maybe<T> {
  if (v == null) return null;
  return [v];
}

export function toVoid<T>(v: Maybe<T>): T | null {
  if (v == null) return null;
  return v[0];
}

export function mapSome<A, B>(a: Maybe<A>, f: (a: A) => B): Maybe<B> {
  if (isSome(a)) {
    return [f(a[0])];
  }

  return null;
}

export function mapSomeAsync<A, B>(a: Maybe<A>, f: (a: A) => Promise<B>): Promise<Maybe<B>> {
  if (isSome(a)) {
    return Promise.resolve(a[0]).then(a => f(a).then(some));
  }

  return Promise.resolve(null);
}

export function bindSome<A, B>(a: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> {
  if (isSome(a)) {
    return f(a[0]);
  }

  return null;
}

export function applySome<A, B>(f: Maybe<(a: A) => B>, a: Maybe<A>): Maybe<B> {
  if (isSome(f)) {
    if (isSome(a)) {
      return [f[0](a[0])];
    }
  }

  return null;
}
