/**
 * Replaces all characters but the last `numCharsShown` characters of a given string with a mask string.
 * @param str string to mask
 * @param numCharsShown number of characters to display at the end
 * @param maskString string to replace masked characters with
 * @returns masked string
 */
const maskString = (
  str: string,
  numCharsShown: number,
  maskString: string = '*',
) => {
  return (
    str.slice(0, -numCharsShown).replace(/./g, maskString) +
    str.slice(-numCharsShown)
  )
}

/**
 * Masks all characters but the last 4 characters of a given nric.
 * @param nric NRIC e.g. S1234567A
 * @returns masked NRIC e.g. S*****567A
 */
export const maskNric = (nric: string): string => {
  return maskString(nric, 4, '*')
}
