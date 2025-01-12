// local address field errors
export const INVALID_POSTAL_CODE_ERROR = 'Please enter a valid postal code'
export const VALID_POSTAL_CODE_NO_ADDRESS_ERROR =
  'Address cannot be found. Please fill in details manually'
export const INVALID_BLOCK_UNIT_ERROR = 'Please use numbers and alphabets only'
export const INVALID_LEVEL_ERROR = 'Please use numbers only'
export const INVALID_LEVEL_UNIT_ERROR = 'Both or none inputs are required' // check with Alicia & Kenneth

export const validatePostalCode = (value: string) => {
  if (!/^[0-9]+$/.test(value) || value.length !== 6) {
    return INVALID_POSTAL_CODE_ERROR
  }
  return true
}

export const validateNoSpecialCharacters = (value: string) => {
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return INVALID_BLOCK_UNIT_ERROR
  }
  return true
}

export const validateNoNonNumerical = (value: string) => {
  if (!/^[0-9]+$/.test(value)) {
    return INVALID_LEVEL_ERROR
  }
  return true
}

export const validateLevelUnit = (unitNumber: string, levelNumber: string) => {
  if (!unitNumber && !levelNumber) return true
  return unitNumber && levelNumber ? true : INVALID_LEVEL_UNIT_ERROR
}
