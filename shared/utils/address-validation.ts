// local address field errors
export const INVALID_POSTAL_CODE_ERROR = 'Please enter a valid postal code'
export const VALID_POSTAL_CODE_NO_ADDRESS_ERROR =
  'Address cannot be found. Please fill in details manually'
export const INVALID_BLOCK_UNIT_ERROR = 'Please user numbers and alphabets only'

export const validatePostalCode = (value: string) => {
  const postalNumber = parseInt(value)
  if (
    !/^[0-9]+$/.test(value) ||
    postalNumber < 100000 ||
    postalNumber > 999999
  ) {
    return INVALID_POSTAL_CODE_ERROR
  }
  return true
}

export const validateBlockUnit = (value: string) => {
  // if (value == 'MANUAL_ERROR') {
  //   // TODO to update when developing api service work
  //   return VALID_POSTAL_CODE_NO_ADDRESS_ERROR
  // }
  if (value !== '' && !/^[A-Za-z0-9]+$/.test(value)) {
    return INVALID_BLOCK_UNIT_ERROR
  }
  return true
}

export const validateStreetName = (value: string) => {
  // if (value == 'MANUAL_ERROR') {
  //   // TODO to update when developing api service work
  //   return VALID_POSTAL_CODE_NO_ADDRESS_ERROR
  // }
  return true
}
