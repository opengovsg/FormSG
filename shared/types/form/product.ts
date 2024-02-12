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
  return (
    products.length > 0 &&
    products.every((product) => {
      return (
        product._id &&
        String(product._id).match(/^[0-9a-fA-F]{24}$/) &&
        product.name &&
        typeof product.name === 'string'
      )
    })
  )
}
