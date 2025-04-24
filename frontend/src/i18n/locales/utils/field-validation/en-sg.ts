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
}
