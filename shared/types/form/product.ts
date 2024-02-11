import { Opaque } from 'type-fest'

export type ProductId = Opaque<string, 'ProductId'>
export type Product = {
  name: string
  description: string
  multi_qty: boolean
  min_qty: number
  max_qty: number
  amount_cents: number
  _id: ProductId
}

export type ProductItem = {
  data: Product
  selected: boolean
  quantity: number
}

// Typeguard for Product
export const isPaymentsProducts = (
  products: unknown,
): products is Product[] => {
  if (!Array.isArray(products)) {
    return false
  }
  return products.every((product) => {
    return (
      typeof product._id === 'string' &&
      typeof product.name === 'string' &&
      typeof product.description === 'string' &&
      typeof product.multi_qty === 'boolean' &&
      typeof product.min_qty === 'number' &&
      typeof product.max_qty === 'number' &&
      typeof product.amount_cents === 'number'
    )
  })
}
