import { z } from 'zod'

export const ProductId = z.string().brand<'ProductId'>()
export type ProductId = z.infer<typeof ProductId>

export const ProductDto = z.object({
  _id: ProductId,
  name: z.string(),
  description: z.string(),
  multi_qty: z.boolean(),
  min_qty: z.number().nonnegative(),
  max_qty: z.number().nonnegative(),
  amount_cents: z.number().nonnegative(),
})
export type Product = z.infer<typeof ProductDto>

export const ProductItemDto = z.object({
  data: ProductDto,
  selected: z.boolean(),
  quantity: z.number().nonnegative(),
})

export type ProductItem = z.infer<typeof ProductItemDto>
export type ProductItemInput = z.input<typeof ProductItemDto>

export type ProductItemForReceipt = {
  name: string
  quantity: number
  amount_cents: number
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
