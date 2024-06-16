import { SpcpSession } from '../types'

/**
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
 */
export const maskNric = (nric: string): string => {
  return maskString(nric, 4, '*')
}

export const makeSpcpSessionWithMaskedNric = (
  spcpSession: SpcpSession,
): SpcpSession => {
  return {
    ...spcpSession,
    userName: maskNric(spcpSession.userName),
  }
}
