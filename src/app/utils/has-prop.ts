/**
 * Utility to narrow type of an object by determining whether
 * it contains the given property.
 * @param obj Object
 * @param prop Property to check
 */

export const hasProp = <K extends string>(
  obj: unknown,
  prop: K,
): obj is Record<K, unknown> => {
  return typeof obj === 'object' && obj !== null && prop in obj
}
