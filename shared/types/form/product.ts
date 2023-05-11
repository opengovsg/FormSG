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
