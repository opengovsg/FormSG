import {
  AdminStorageFormDto,
  FormResponseMode,
  PaymentType,
  ProductItemForReceipt,
} from '~shared/types'

export const paymentTypeSelection = (
  form: AdminStorageFormDto,
): { paymentProducts: ProductItemForReceipt[]; totalAmount: number } => {
  let paymentProducts: ProductItemForReceipt[] = []
  let totalAmount = 0

  const { payments_field } = form
  switch (payments_field.payment_type) {
    case PaymentType.Products: {
      const isMultiProduct =
        form.responseMode === FormResponseMode.Encrypt &&
        payments_field.products_meta?.multi_product
      if (isMultiProduct) {
        paymentProducts = payments_field.products?.map((product) => {
          return {
            name: product.name,
            quantity: product.min_qty,
            amount_cents: product.amount_cents,
          }
        }) as ProductItemForReceipt[]
        // add up total amount
        totalAmount = paymentProducts.reduce((accum, cur) => {
          return accum + cur.amount_cents * cur.quantity
        }, 0)
      } else {
        paymentProducts = [
          {
            name: payments_field.products
              ? payments_field.products[0].name
              : 'Product/Service',
            quantity: payments_field.products[0].min_qty,
            amount_cents: payments_field.products[0].amount_cents,
          },
        ] as ProductItemForReceipt[]
        totalAmount =
          paymentProducts[0].quantity * paymentProducts[0].amount_cents
      }
      break
    }

    case PaymentType.Fixed: {
      paymentProducts = [
        {
          name: payments_field.name,
          quantity: 1,
          amount_cents: payments_field.amount_cents,
        },
      ] as ProductItemForReceipt[]
      totalAmount = payments_field.amount_cents
      break
    }

    case PaymentType.Variable: {
      paymentProducts = [
        {
          name: payments_field.name,
          quantity: 1,
          amount_cents: payments_field.min_amount,
        },
      ] as ProductItemForReceipt[]
      totalAmount = payments_field.min_amount
      break
    }

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = payments_field
    }
  }
  return { paymentProducts, totalAmount }
}
