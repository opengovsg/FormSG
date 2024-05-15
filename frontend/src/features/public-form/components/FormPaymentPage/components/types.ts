import { FormColorTheme, ProductsPaymentField } from '~shared/types'

export interface PaymentItemNameDescriptionProps {
  paymentItemName: string | undefined
  paymentDescription: string | undefined
}
type PaymentItemDetailsProps = PaymentItemNameDescriptionProps

export interface VariableItemDetailProps extends PaymentItemDetailsProps {
  paymentMin: number
  paymentMax: number
  globalMinAmountOverride: number | undefined
}

export interface FixedItemDetailProps extends PaymentItemDetailsProps {
  colorTheme: FormColorTheme
  paymentAmount: number | undefined
}

export interface ProductItemDetailProps {
  colorTheme: FormColorTheme
  paymentDetails: ProductsPaymentField
}
