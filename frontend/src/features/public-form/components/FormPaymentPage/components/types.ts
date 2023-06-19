import { FormColorTheme } from '~shared/types'

import { PaymentItemNameDescriptionProps } from './PaymentItemNameDescription'

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
