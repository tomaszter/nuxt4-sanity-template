// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

type UnionObjKeys<T extends AnyObj> = T extends AnyObj ? keyof T : never;

export type ExtractKeyFromUnionObj<
  T extends AnyObj,
  K extends UnionObjKeys<T>,
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<K, any> ? T : never;

/**
 * Checks if property exists in the union of objects
 * This function is likely helpfull when checking data coming from Sanity
 * @param obj Object that has union of objects type
 * @param key Key to check (intellisense provided by typescript)
 * @returns
 */
export function hasProp<T extends AnyObj, K extends UnionObjKeys<T>>(
  obj: T,
  key: K
): obj is ExtractKeyFromUnionObj<T, K> {
  return key in obj;
}
