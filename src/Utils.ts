import _ from "lodash";

/** like map, but doesn't have to start at index 0 */
export function mapFrom<T, U>(
  a: T[],
  start: number,
  fn: (value: T, index: number) => U
): U[] {
  const result: U[] = [];
  for (let i = start; i < a.length; i++) {
    const value = fn(a[i], i);
    result.push(value);
  }
  return result;
}

// SOON look at adopting wu or itiriri
export function* tail<T>(a: Iterable<T>): Generator<T, void, unknown> {
  const iter = a[Symbol.iterator]();
  iter.next(); // skip first
  let next = iter.next();
  while (!next.done) {
    yield next.value;
    next = iter.next();
  }
}

export function* head<T>(a: Iterable<T>): Generator<T, void, unknown> {
  const iter = a[Symbol.iterator]();
  const next = iter.next();
  if (!next.done) {
    yield next.value;
  }
}

// sliding window of size 2
export function pairs<T>(a: Iterable<T>): Generator<[T, T], void, unknown> {
  return zip2(a, tail(a));
}

export function* zip2<T>(
  a: Iterable<T>,
  b: Iterable<T>
): Generator<[T, T], void, unknown> {
  const iterA = a[Symbol.iterator]();
  const iterB = b[Symbol.iterator]();
  let nextA = iterA.next();
  let nextB = iterB.next();
  while (!nextA.done && !nextB.done) {
    yield [nextA.value, nextB.value];
    nextA = iterA.next();
    nextB = iterB.next();
  }
}

export function* count(c: number): Generator<number, void, unknown> {
  let a = 0;
  while (a < c) {
    yield a;
    a++;
  }
}

export function* takeWhile<T>(
  gen: Generator<T, void, undefined>,
  fn: (value: T) => boolean
) {
  for (let value of gen) {
    if (fn(value)) {
      return value;
    } else {
      break;
    }
  }
}

export const identityFn = <T>(x: T): T => x;

type ObjOrArray = object | Array<any>;

export function removeKeysDeep(obj: ObjOrArray, prefix: string): ObjOrArray {
  return removeDeep(obj, (_value: any, key: string) => key === prefix);
}

/** return a copy of an object with fields removed by a filter function */
export function removeDeep(
  src: ObjOrArray,
  fn: (value: any, key: string, path: string[]) => boolean
): ObjOrArray {
  return removeRecursive(src, []);

  function removeRecursive(obj: ObjOrArray, path: string[]): ObjOrArray {
    if (_.isArray(obj)) {
      return obj.map((elem) => removeDeep(elem, fn));
    }

    if (_.isObject(obj)) {
      const filtered = Object.entries(obj).filter(
        ([key, value]) => !fn(value, key, path)
      );
      const copies = filtered.map(([key, value]) => [
        key,
        removeRecursive(value, path.concat([key])),
      ]);
      return Object.fromEntries(copies);
    }

    return obj;
  }
}

/** replace undefined fields with a default value */
export function replaceUndefined<T extends Partial<U>, U>(obj: T, defaults: U): T & U {
  const result = { ...defaults, ...removeUndefined(obj) };
  return result;
}

/** @return a copy, eliding fields with undefined values */
export function removeUndefined<T>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }
  return result;
}
