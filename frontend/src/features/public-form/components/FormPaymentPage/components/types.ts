import { FormColorTheme } from '~shared/types'

export interface PaymentItemNameDescriptionProps {
  paymentItemName: string | undefined
  paymentDescription: string | undefined
}
type PaymentItemDetailsProps = PaymentItemNameDescriptionProps

export interface VariableItemDetailProps extends PaymentItemDetailsProps {
  paymentMin: number
  paymentMax: number
}

export interface FixedItemDetailProps extends PaymentItemDetailsProps {
  colorTheme: FormColorTheme
  paymentAmount: number | undefined
}
