import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

/**
 * Validates the phone number string using length information
 * @param phoneNumber
 * @returns true if validate, false otherwise
 */
export const isPhoneNumber = (phoneNumber: string): boolean => {
  const parsedNumber = parsePhoneNumberFromString(phoneNumber)

  if (!parsedNumber) {
    return false
  }

  // Using length validation only for SG numbers due to some valid SG numbers
  // being marked as invalid due to its newness.
  // Regex checks if the national number starts with 8 or 9, and is of length 8.
  if (parsedNumber.countryCallingCode === '65') {
    return (
      parsedNumber.isPossible() &&
      !!parsedNumber.nationalNumber.match(/^[89][0-9]{7}$/g)
    )
  }
  return parsedNumber.isValid()
}

/**
 * Validates the mobile phone number string
 * @param mobileNumber
 * @returns true if validate, false otherwise
 */
export const isMobilePhoneNumber = (mobileNumber: string): boolean => {
  const parsedNumber = parsePhoneNumberFromString(mobileNumber)

  if (!parsedNumber) return false

  return (
    isPhoneNumber(mobileNumber) &&
    // Have to include both MOBILE, FIXED_LINE_OR_MOBILE and unknown (as
    // `undefined`) as some countries lump the types together, or the number is
    // too new (in SG's case).
    ['FIXED_LINE_OR_MOBILE', 'MOBILE', undefined].includes(
      parsedNumber.getType(),
    )
  )
}

/**
 * Validates the given phone number string is a home phone number.
 * @param phoneNum the phone number string to validate
 * @returns true if validated, false otherwise.
 */
export const isHomePhoneNumber = (phoneNum: string): boolean => {
  const parsedNumber = parsePhoneNumberFromString(phoneNum)

  if (!parsedNumber) return false

  return isPhoneNumber(phoneNum) && 'FIXED_LINE' === parsedNumber.getType()
}

export const startsWithSgPrefix = (mobileNumber: string): boolean => {
  return mobileNumber.startsWith('+65')
}
