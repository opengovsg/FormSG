import { FormColorTheme } from '~shared/types'

export interface PaymentItemNameDescriptionProps {
  paymentItemName: string | undefined
  paymentDescription: string | undefined
}
interface PaymentItemDetailsProps extends PaymentItemNameDescriptionProps {
  colorTheme: FormColorTheme
}

export interface VariableItemDetailProps extends PaymentItemDetailsProps {
  paymentMin: number
  paymentMax: number
}

export interface FixedItemDetailProps extends PaymentItemDetailsProps {
  paymentAmount: number | undefined
}
