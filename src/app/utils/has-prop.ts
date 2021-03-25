/**
 * Utility to narrow type of an object by determining whether
 * it contains the given property.
 * @param obj Object
 * @param prop Property to check
 */

export const hasProp = <K extends string>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  obj: object | Record<string, unknown>,
  prop: K,
): obj is Record<K, unknown> => {
  return prop in obj
}
