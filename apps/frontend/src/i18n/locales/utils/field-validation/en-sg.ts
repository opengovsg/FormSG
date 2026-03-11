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

interface DropdownFieldValidation {
  invalidDropdownOption: string
  invalidCountryRegion: string
}

const dropdownFieldValidation: DropdownFieldValidation = {
  invalidDropdownOption: 'Entered value is not a valid dropdown option',
  invalidCountryRegion:
    'Please select a valid country/region from the dropdown list',
}

interface TextFieldValidation {
  exactCharacters: string
  minCharacters: string
  maxCharacters: string
}

const textFieldValidation: TextFieldValidation = {
  exactCharacters:
    'Please enter {threshold} {threshold, plural, =1 {character} other {characters}} ({current}/{threshold})',
  minCharacters:
    'Please enter at least {threshold} {threshold, plural, =1 {character} other {characters}} ({current}/{threshold})',
  maxCharacters:
    'Please enter at most {threshold} {threshold, plural, =1 {character} other {characters}} ({current}/{threshold})',
}

interface EmailFieldValidation {
  invalidEmail: string
  pleaseVerifyEmail: string
  domainDisallowed: string
}

const emailFieldValidation: EmailFieldValidation = {
  invalidEmail: 'Please enter a valid email',
  pleaseVerifyEmail: 'Please verify your email address',
  // TODO: decide how to combine with src/i18n/locales/features/public-form/fields/en-sg.ts
  domainDisallowed: 'Domain disallowed',
}

interface MobileFieldValidation {
  validMobile: string
  pleaseVerifyMobile: string
}

const mobileFieldValidation: MobileFieldValidation = {
  validMobile: 'Please enter a valid mobile number',
  pleaseVerifyMobile: 'Please verify your mobile number',
}

interface HomeNoFieldValidation {
  validHomeNo: string
}

const homeNoFieldValidation: HomeNoFieldValidation = {
  validHomeNo: 'Please enter a valid landline number',
}

interface AddressFieldValidation {
  invalidNonNumerical: string
  invalidPostalCode: string
  invalidBlockUnit: string
  invalidLevelUnit: string
  validPostalCodeNoAddress: string
}

const addressFieldValidation: AddressFieldValidation = {
  invalidNonNumerical: 'Please use numbers only',
  invalidPostalCode: 'Please enter a valid postal code',
  invalidBlockUnit: 'Please use numbers and letters only',
  invalidLevelUnit: 'Please include both level and unit number',
  validPostalCodeNoAddress:
    'Address cannot be found. Please fill in details manually',
}

export type FieldValidation = BaseValidation &
  NumberFieldValidation &
  DecimalFieldValidation &
  UenFieldValidation &
  DateFieldValidation &
  NricFieldValidation &
  CheckboxFieldValidation &
  DropdownFieldValidation &
  TextFieldValidation &
  EmailFieldValidation &
  MobileFieldValidation &
  HomeNoFieldValidation &
  AddressFieldValidation

export const enSG: FieldValidation = {
  ...baseValidation,
  ...numberFieldValidation,
  ...decimalFieldValidation,
  ...uenFieldValidation,
  ...dateFieldValidation,
  ...nricFieldValidation,
  ...checkboxFieldValidation,
  ...checkboxFieldValidation,
  ...dropdownFieldValidation,
  ...textFieldValidation,
  ...emailFieldValidation,
  ...mobileFieldValidation,
  ...homeNoFieldValidation,
  ...addressFieldValidation,
  // NOTE: excluding MyInfo fields for now.
}
