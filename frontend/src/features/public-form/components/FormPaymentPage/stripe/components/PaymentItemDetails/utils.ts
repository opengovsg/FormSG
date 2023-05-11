import { ProductItem } from '~shared/types'

export const calculatePrice = (productItems: Array<ProductItem>) => {
  const total = productItems.reduce((accum, item) => {
    if (item.selected) {
      return accum + item.data.amount_cents * item.quantity
    }
    return accum
  }, 0)
  return total
}

/**
 * Generates integer range, inclusive of start anding values
 * [start, end]
 */
export const generateIntRange = (start: number, end: number) => {
  const arrayLen = end - start + 1
  const arr = new Array(arrayLen).fill(0)
  return arr.map((_, i) => i + start + 1)
}
