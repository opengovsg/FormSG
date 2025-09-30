import values from 'lodash/values'

// Shared centralised mapping layer for use in both frontend and backend to get the mapped value.

export enum VerifiedKeys {
  SpUinFin = 'uinFin',
  CpUen = 'cpUen',
  CpUid = 'cpUid',
  SgidUinFin = 'sgidUinFin',
}

/**
 * Array determines the order to process and display the verified fields in both
 * the detailed responses page and the csv file.
 */
export const CURRENT_VERIFIED_FIELDS: VerifiedKeys[] = values(VerifiedKeys)

export enum SPCPFieldTitle {
  SpNric = 'SingPass Validated NRIC',
  CpUid = 'CorpPass Validated UID',
  CpUen = 'CorpPass Validated UEN',
}

export enum SgidFieldTitle {
  SgidNric = 'sgID Validated NRIC',
}

export const VerifiedKeyToSPCPTitleMap: Record<VerifiedKeys, SPCPFieldTitle> = {
  [VerifiedKeys.SpUinFin]: SPCPFieldTitle.SpNric,
  [VerifiedKeys.CpUen]: SPCPFieldTitle.CpUen,
  [VerifiedKeys.CpUid]: SPCPFieldTitle.CpUid,
  [VerifiedKeys.SgidUinFin]: SPCPFieldTitle.SpNric, // safeguarding for backwards compatibility
}

/**
 * Maps SPCP VerifiedKeys to their titles. Used during decryption/population of outputs.
 * Since MRF verifiedContent contains step data in the keys, we handle and retain in during mapping
 * (e.g. IndividualResponsePage, CSV, emails)
 * @param key VerifiedKeys string with step number
 * @returns SPCPFieldTitle with step number
 */
export function mapVerifiedKeyToSPCPTitle(key: string): string {
  // Extract the base key and optional step
  const match = key.match(/^(\w+)(\s*\(Step \d+\))?/)
  if (!match) return key

  const baseKey = match[1] as VerifiedKeys
  const stepSuffix = match[2] ?? ''

  const mappedTitle = VerifiedKeyToSPCPTitleMap[baseKey]
  return mappedTitle ? `${mappedTitle}${stepSuffix}` : key
}
