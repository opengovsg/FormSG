import { Product } from '~shared/types'

export type ProductItem = {
  data: Product
  selected: boolean
  quantity: number
}
