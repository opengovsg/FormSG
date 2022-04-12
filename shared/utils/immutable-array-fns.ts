/**
 * This utility file contains immutable array functions.
 */

import { ExtractTypeFromArray } from '../types/utils'

/**
 * Pure function to reorders given array from given `fromIndex` to `toIndex`.
 * The new reordered array will be returned.
 *
 * If initial `fromIndex` is out of bounds of the original array, no reordering
 * will be performed and the initial array will be returned.
 *
 * Function retrieved from
 * https://github.com/granteagon/move/blob/master/src/index.js and converted to
 * TypeScript and renamed for clarity.
 *
 * @param array initial array to reorder
 * @param fromIndex the current index of the element to move
 * @param toIndex the new index to move the element to
 * @returns reordered array
 */
export const reorder = <T>(
  array: ExtractTypeFromArray<T>[],
  fromIndex: number,
  toIndex: number,
): ExtractTypeFromArray<T>[] => {
  /**
   * Invalid index, return array as is.
   * The index is checked instead of definedness of element at the index as
   * given array may contain undefined elements and will not be a comprehensive
   * validity check.
   */
  if (fromIndex < 0 || fromIndex >= array.length) {
    return array
  }

  const elementToMove = array[fromIndex]

  const diff = fromIndex - toIndex

  if (diff > 0) {
    // Reorder to the left.
    return [
      ...array.slice(0, toIndex),
      elementToMove,
      ...array.slice(toIndex, fromIndex),
      ...array.slice(fromIndex + 1, array.length),
    ]
  } else if (diff < 0) {
    // Reorder to the right.
    const targetIndex = toIndex + 1
    return [
      ...array.slice(0, fromIndex),
      ...array.slice(fromIndex + 1, targetIndex),
      elementToMove,
      ...array.slice(targetIndex, array.length),
    ]
  }
  return array
}

/**
 * Pure function to replace element at given `index` with `newValue`.
 *
 * @param array initial array to replace element for
 * @param index index to replace element at
 * @param newValue the new value to replace with
 *
 * @return new array with replaced value
 */
export const replaceAt = <T>(
  array: ExtractTypeFromArray<T>[],
  index: number,
  newValue: ExtractTypeFromArray<T>,
): ExtractTypeFromArray<T>[] => {
  const ret = array.slice(0)
  ret[index] = newValue
  return ret
}

export const insertAt = <T>(
  array: ExtractTypeFromArray<T>[],
  index: number,
  valueToInsert: ExtractTypeFromArray<T>,
): ExtractTypeFromArray<T>[] => {
  return [...array.slice(0, index), valueToInsert, ...array.slice(index)]
}

export const removeAt = <T>(
  array: ExtractTypeFromArray<T>[],
  index: number,
): ExtractTypeFromArray<T>[] => {
  return [...array.slice(0, index), ...array.slice(index + 1)]
}
