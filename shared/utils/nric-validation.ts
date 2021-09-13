type NricParts = {
  prefix: string
  digits: string
  checksum: string
}

const NRIC_FORMAT = /^(?<prefix>[STFG])(?<digits>\d{7})(?<checksum>[A-Z])$/

/**
 * Validates whether a provided string value adheres to the UIN/FIN format
 * as provided on the Singapore Government's National Registration Identity Card.
 * @param value The value to be validated
 */
export const isNricValid = (value: string): boolean => {
  const parsed = value?.toUpperCase().match(NRIC_FORMAT)

  if (!parsed) return false

  const { prefix, digits, checksum } = parsed.groups as NricParts

  // http://www.ngiam.net/NRIC/NRIC_numbers.pdf
  const coefficients = [2, 7, 6, 5, 4, 3, 2]
  const startConstant = prefix === 'S' || prefix === 'F' ? 0 : 4
  const checksumEncoding =
    prefix === 'S' || prefix === 'T' ? 'JZIHGFEDCBA' : 'XWUTRQPNMLK'

  const sum = coefficients.reduce(
    (acc, coef, idx) => acc + coef * parseInt(digits[idx]),
    startConstant,
  )

  return checksum === checksumEncoding[sum % 11]
}
