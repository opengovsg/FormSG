// import { INVALID_POSTAL_CODE_ERROR } from '~constants/validation'

// local address field errors
export const INVALID_POSTAL_CODE_ERROR = 'Please enter a valid postal code'
export const VALID_POSTAL_CODE_NO_ADDRESS_ERROR =
  'Address cannot be found. Please fill in details manually'
export const INVALID_BLOCK_UNIT_ERROR = 'Please user numbers and alphabets only'

export const validatePostalCode = (value: number) => {
  if (value && (value < 10000 || value > 99999)) {
    return INVALID_POSTAL_CODE_ERROR
  }
  return true
}
