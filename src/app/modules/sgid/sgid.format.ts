/**
 * Formats SGID MyInfo attribute as address.
 * SGID MyInfo multi-line address are newline-separated, while MyInfo multi-line addresses are comma-separated
 * @param addr The address to format.
 * @example '29 ROCHDALE ROAD\n\nSINGAPORE 535842'
 * @returns Formatted address is comma separated, same as the output of formatAddress in myinfo.format.ts
 */
export const formatAddress = (addr: string): string => {
  const formattedAddress = addr.replace(/(\n)+/g, ', ')
  return formattedAddress
}
