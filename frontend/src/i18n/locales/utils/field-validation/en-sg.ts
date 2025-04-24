interface BaseValidation {
  required: string
}

const baseValidation: BaseValidation = {
  required: 'This field is required',
}

interface NumberFieldValidation {
  exactDigits: string
  minDigits: string
  maxDigits: string
  validNumber: string
  numbersRange: string
  numberMinimum: string
  numberMaximum: string
}

const numberFieldValidation: NumberFieldValidation = {
  exactDigits:
    'Please enter {threshold} {threshold, plural, =1 {digit} other {digits}} ({current}/{threshold})',
  minDigits:
    'Please enter at least {threshold} {threshold, plural, =1 {digit} other {digits}} ({current}/{threshold})',
  maxDigits:
    'Please enter at most {threshold} {threshold, plural, =1 {digit} other {digits}} ({current}/{threshold})',
  validNumber: 'Please enter a valid number',
  numbersRange: 'Please enter a number between {min} and {max}',
  numberMinimum: 'Please enter a number that is at least {min}',
  numberMaximum: 'Please enter a number that is at most {max}',
}

interface DecimalFieldValidation {
  validDecimal: string
  validDecimalNoLeadingZeros: string
  decimalRange: string
  decimalMinimum: string
  decimalMaximum: string
}

const decimalFieldValidation: DecimalFieldValidation = {
  validDecimal: 'Please enter a valid decimal',
  validDecimalNoLeadingZeros:
    'Please enter a valid decimal without leading zeros',
  decimalRange: 'Please enter a decimal between {min} and {max} (inclusive)',
  decimalMinimum: 'Please enter a decimal greater than or equal to {min}',
  decimalMaximum: 'Please enter a decimal less than or equal to {max}',
}

interface UenFieldValidation {
  validUen: string
}

const uenFieldValidation: UenFieldValidation = {
  validUen: 'Please enter a valid UEN',
}

export type FieldValidation = BaseValidation &
  NumberFieldValidation &
  DecimalFieldValidation &
  UenFieldValidation

export const enSG: FieldValidation = {
  ...baseValidation,
  ...numberFieldValidation,
  ...decimalFieldValidation,
  ...uenFieldValidation,
}
