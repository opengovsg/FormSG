/**
 * Validates whether a provided string value adheres to the UIN/FIN format
 * as provided on the Singapore Government's National Registration Identity Card.
 * @param value The value to be validated
 */
export const isNricValid = (value: string): boolean => {
  return isFormatValid(value) && isChecksumValid(value)
}

/**
 * Tests whether a provided string value obeys a simple format check
 * @param value The value to be validated
 */
const isFormatValid = (value: string): boolean => {
  return /^([STFGstfg]{1})([0-9]{7})([A-Za-z]{1})$/.test(value)
}

/**
 * Algorithm to test whether the NRIC checksum is valid
 * @param value The value to be validated
 */
const isChecksumValid = (value: string): boolean => {
  // http://www.ngiam.net/NRIC/NRIC_numbers.pdf
  value = value.toUpperCase()
  const prefix = value.charAt(0)
  const suffix = value.charAt(value.length - 1)
  const coefficients = [2, 7, 6, 5, 4, 3, 2]
  const constant = prefix === 'S' || prefix === 'F' ? 0 : 4
  const coding =
    prefix === 'S' || prefix === 'T'
      ? ['J', 'Z', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
      : ['X', 'W', 'U', 'T', 'R', 'Q', 'P', 'N', 'M', 'L', 'K']
  const sum = value
    .substring(1, value.length - 1)
    .split('')
    .reduce(function (sum, digit, idx) {
      sum += parseInt(digit) * coefficients[idx]
      return sum
    }, constant)
  return suffix === coding[sum % 11]
}
