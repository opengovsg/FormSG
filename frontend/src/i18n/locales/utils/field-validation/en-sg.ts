export interface FieldValidation {
  required: string

  // number field
  exactDigits: string
  minDigits: string
  maxDigits: string
  validNumber: string
  numbersRange: string
  numberMinimum: string
  numberMaximum: string

  // decimal field
  validDecimal: string
  validDecimalNoLeadingZeros: string
  decimalRange: string
  decimalMinimum: string
  decimalMaximum: string
}

export const enSG: FieldValidation = {
  required: 'This field is required',
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

  validDecimal: 'Please enter a valid decimal',
  validDecimalNoLeadingZeros:
    'Please enter a valid decimal without leading zeros',
  decimalRange: 'Please enter a decimal between {min} and {max} (inclusive)',
  decimalMinimum: 'Please enter a decimal greater than or equal to {min}',
  decimalMaximum: 'Please enter a decimal less than or equal to {max}',
}
