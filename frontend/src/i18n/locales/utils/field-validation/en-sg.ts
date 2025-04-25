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

interface DateFieldValidation {
  validDate: string
  noFutureDate: string
  noPastDate: string
  dateOutOfRange: string
  invalidDay: string
}

const dateFieldValidation: DateFieldValidation = {
  validDate: 'Please enter a valid date',
  noFutureDate: 'Only dates today or before are allowed',
  noPastDate: 'Only dates today or after are allowed',
  dateOutOfRange: 'Selected date is not within the allowed date range',
  invalidDay: 'This date is not allowed by the form admin',
}

interface NricFieldValidation {
  validNric: string
}

const nricFieldValidation: NricFieldValidation = {
  validNric: 'Please enter a valid NRIC/FIN',
}

interface CheckboxFieldValidation {
  exactOptions: string
  minOptions: string
  maxOptions: string
}

const checkboxFieldValidation: CheckboxFieldValidation = {
  exactOptions:
    'Please select exactly {threshold} {threshold, plural, =1 {option} other {options}} ({current}/{threshold})',
  minOptions:
    'Please select at least {threshold} {threshold, plural, =1 {option} other {options}} ({current}/{threshold})',
  maxOptions:
    'Please select at most {threshold} {threshold, plural, =1 {option} other {options}} ({current}/{threshold})',
}

export type FieldValidation = BaseValidation &
  NumberFieldValidation &
  DecimalFieldValidation &
  UenFieldValidation &
  DateFieldValidation &
  NricFieldValidation &
  CheckboxFieldValidation

export const enSG: FieldValidation = {
  ...baseValidation,
  ...numberFieldValidation,
  ...decimalFieldValidation,
  ...uenFieldValidation,
  ...dateFieldValidation,
  ...nricFieldValidation,
  ...checkboxFieldValidation,
}
