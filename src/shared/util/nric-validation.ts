export const isNricValid = (value: string): boolean => {
  return isFormatValid(value) && isChecksumValid(value)
}

const isFormatValid = (value: string): boolean => {
  return /^([STFGstfg]{1})([0-9]{7})([A-Za-z]{1})$/.test(value)
}

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
