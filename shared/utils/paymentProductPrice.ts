import { ProductItem } from '../types'

export const calculatePrice = (productItems: Array<ProductItem>) => {
  const total = productItems.reduce((accum, item) => {
    if (item.selected) {
      return accum + item.data.amount_cents * item.quantity
    }
    return accum
  }, 0)
  return total
}
