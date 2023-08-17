import {
  ExtractTypeFromArray,
  FormPaymentsField,
  ProductId,
} from '~shared/types'

/**
 * Used as a placeholder for the payment preview when
 * there's no item created by the admin
 */
export const PRODUCT_ITEM_PLACEHOLDER: ExtractTypeFromArray<
  NonNullable<FormPaymentsField['products']>
> = {
  name: 'Product/Service Name',
  description: '',
  multi_qty: true,
  min_qty: 1,
  max_qty: 1,
  amount_cents: 0,
  _id: '_id' as ProductId,
}
