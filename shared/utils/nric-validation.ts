const NRIC_FORMAT = /^([STFG])(\d{7})([A-Z])$/

/**
 * Validates whether a provided string value adheres to the UIN/FIN format
 * as provided on the Singapore Government's National Registration Identity Card.
 * @param value The value to be validated
 */
export const isNricValid = (value: string): boolean => {
  const parsed = value?.toUpperCase().match(NRIC_FORMAT)

  if (!parsed) return false

  const [, prefix, digits, checksum] = parsed

  // Specifications at: http://www.ngiam.net/NRIC/NRIC_numbers.pdf
  const weights = [2, 7, 6, 5, 4, 3, 2]
  const startConstant = prefix === 'S' || prefix === 'F' ? 0 : 4
  const checksumEncoding =
    prefix === 'S' || prefix === 'T' ? 'JZIHGFEDCBA' : 'XWUTRQPNMLK'

  const weightedSum = weights.reduce(
    (acc, weight, idx) => acc + weight * parseInt(digits[idx]),
    startConstant,
  )

  return checksum === checksumEncoding[weightedSum % 11]
}

/**
 * M-prefixed FIN series, to be launched from 1 Jan 2022.
 * @param value The string to be validated
 */
export const isMFinSeriesValid = (value: string): boolean => {
  const format = /^[M](\d{7})([KLJNPQRTUWX])$/
  const parsed = value.toUpperCase().match(format)

  if (!parsed) return false

  const [, digits, checksum] = parsed

  const weights = [2, 7, 6, 5, 4, 3, 2]
  const checksumEncoding = 'KLJNPQRTUWX'

  // a) Multiply each numeral of the FIN starting from left to right by the constant values as shown below:
  // b) Sum (S1) the results.  Add a weightage of three to the results (S1).
  const S1 = weights.reduce(
    (acc, weight, idx) => acc + weight * parseInt(digits[idx]),
    3,
  )
  // c) Divide the sum (S1) by 11 giving the remainder (R1)
  const R1 = S1 % 11

  // d) Calculate P = 11 – R1 and extract the check digit depending on the value of P
  const P = 11 - R1

  return checksum === checksumEncoding[P - 1]
}
