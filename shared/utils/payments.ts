import { PaymentsUpdateDto, PaymentType } from '../types'

export const centsToDollars = (amountCents: number) => {
  const decimalPlaces = 2
  const amountCentsStr = amountCents.toString().padStart(decimalPlaces + 1, '0')
  return `${amountCentsStr.slice(0, -decimalPlaces)}.${amountCentsStr.slice(
    -decimalPlaces,
  )}`
}

export const dollarsToCents = (dollarStr: string) => {
  // Only works with the validation rules applied
  const tokens = dollarStr.trim().split('.')
  return Number(`${tokens[0]}${(tokens[1] ?? '').padEnd(2, '0')}`)
}

export const formatCurrency = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format

export const PAYMENT_DELETE_DEFAULT: PaymentsUpdateDto = {
  enabled: false,
  payment_type: PaymentType.Products,
  products: [],
}
