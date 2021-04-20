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

  return parsedNumber.isPossible()
}

/**
 * Validates the mobile phone number string
 * @param mobileNumber
 * @returns true if validate, false otherwise
 */
export const isMobilePhoneNumber = (mobileNumber: string): boolean => {
  const parsedNumber = parsePhoneNumberFromString(mobileNumber)

  if (!parsedNumber) return false

  if (startsWithSgPrefix(mobileNumber)) {
    return (
      isPhoneNumber(mobileNumber) &&
      // Regex checks if the national number starts with 8 or 9, and is of
      // length 8.
      !!parsedNumber.nationalNumber.match(/^[89][0-9]{7}$/g)
    )
  }

  // Not Singapore number, check type and early return if undefined.
  const parsedType = parsedNumber.getType()
  if (!parsedType) return false

  // All other countries uses number type to check for validity.
  return (
    isPhoneNumber(mobileNumber) &&
    // Have to include both MOBILE, FIXED_LINE_OR_MOBILE as some countries lump
    // the types together.
    ['FIXED_LINE_OR_MOBILE', 'MOBILE'].includes(parsedType)
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

  // For SG numbers only check if it starts with 3 or 6 and has 8 digits
  // Leading number 3 is for IP Telephony (IPT) service and User-Centric Data-Only (UCDO) service
  // Leading number 6 is for  PSTN service and IP Telephony (IPT) service.
  // In both cases the length is 8
  // See IMDA's national numbering plan for specifications: https://www.imda.gov.sg/-/media/imda/files/regulation-licensing-and-consultations/frameworks-and-policies/numbering/national-numbering-plan-and-allocation-process/national-numbering-plan-30-nov-2017.pdf?la=en
  if (startsWithSgPrefix(phoneNum)) {
    return (
      isPhoneNumber(phoneNum) &&
      // Regex checks if the national number starts with 3 or 6, and is of
      // length 8.
      !!parsedNumber.nationalNumber.match(/^[36][0-9]{7}$/g)
    )
  }
  // For intl numbers check number type as well
  const parsedType = parsedNumber.getType()
  if (!parsedType) return false
  return (
    isPhoneNumber(phoneNum) &&
    // Have to include both FIXED_LINE, FIXED_LINE_OR_MOBILE as some countries lump
    // the types together.
    ['FIXED_LINE', 'FIXED_LINE_OR_MOBILE'].includes(parsedType)
  )
}

export const startsWithSgPrefix = (phoneNumber: string): boolean => {
  return phoneNumber.startsWith('+65')
}
