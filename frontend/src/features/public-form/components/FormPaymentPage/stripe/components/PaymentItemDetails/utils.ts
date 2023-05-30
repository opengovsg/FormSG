import { ProductItem } from '~shared/types'

/**
 * Generates integer range, inclusive of start anding values
 * [start, end]
 */
export const generateIntRange = (start: number, end: number) => {
  const arrayLen = end - start + 1
  const arr = new Array(arrayLen).fill(0)
  return arr.map((_, i) => i + start + 1)
}
