import _ from "lodash";

type ObjOrArray = object | Array<any>;

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

/**
 * @return a deep copy of an object or value, preserving only 'plain' serializable
 * properties and values.
 *
 * Properties whose values are numbers, strings, booleans, Dates, undefined, null,
 * arrays or objects are copied.
 *
 * Getter properties and properties with function values are dropped. */
export function clonePlain(src: any): any {
  if (isPrimitive(src)) {
    return src;
  } else if (_.isArray(src)) {
    return src.filter(isPlain).map(clonePlain);
  } else if (_.isObject(src) && !_.isFunction(src)) {
    const plain = Object.entries(src).filter(
      ([key, value]) => !isGetter(src, key) && isPlain(value)
    );
    const copy = plain.map(([key, value]) => [key, clonePlain(value)]);
    return Object.fromEntries(copy);
  } else {
    return undefined;
  }
}

export interface AnyObject {
  [key: string]: any;
}

export function findGetters(src: AnyObject, pathPrefix: string[] = []): string[][] {
  const result = Object.entries(src).flatMap(([key, value]) => {
    if (isGetter(src, key)) {
      const getter = [pathPrefix.concat([key])];
      return getter;
    } else if (_.isPlainObject(value)) {
      const found = findGetters(value, pathPrefix.concat([key]));
      return found;
    } else {
      return [];
    }
  });
  return result;
}

/** Copy target properties from a src to a dest object, mutating the destination object.
 * Target properties in child objects of the src object.
 * Parent objects of target properties are created in the dest object as necessary.
 *
 * Property getters are not copied.
 *
 * @param keyFilter function to identify property keys to copy.
 */
export function filterCopy(
  src: AnyObject,
  dest: AnyObject,
  keyFilter: (key: string, path: string[]) => boolean
): void {
  copyRecurse(src, []);

  function copyRecurse(from: AnyObject, path: string[]): void {
    const srcKeys = Object.keys(from);
    const copyKeys = srcKeys.filter(
      (key) =>
        keyFilter(key, path) &&
        Object.getOwnPropertyDescriptor(from, key)?.get === undefined
    );
    copyKeys.forEach((key) => pathSet(path.concat([key]), dest, from[key]));

    const recurseKeys = Object.keys(from).filter(
      (key) => !keyFilter(key, path) && _.isPlainObject(from[key])
    );

    recurseKeys.forEach((key) => copyRecurse(from[key], path.concat([key])));
  }
}

function pathSet(fullPath: string[], destRoot: AnyObject, value: any): void {
  const path = fullPath.slice(0, fullPath.length - 1);
  const key = _.last(fullPath)!;

  let destChild = destRoot;
  for (const pathElem of path) {
    if (destChild[pathElem] === undefined) {
      destChild[pathElem] = {};
    }
    destChild = destChild[pathElem];
  }

  destChild[key] = value;
}

function isPrimitive(value: any): boolean {
  return (
    value === undefined ||
    value === null ||
    _.isNumber(value) ||
    _.isString(value) ||
    _.isBoolean(value) ||
    _.isDate(value)
  );
}

function isPlain(value: any): boolean {
  return (
    isPrimitive(value) || _.isArray(value) || (_.isObject(value) && !_.isFunction(value))
  );
}

function isGetter(src: {}, key: string): boolean {
  const desc = Object.getOwnPropertyDescriptor(src, key);
  if (desc && desc.get) {
    return true;
  }
  return false;
}