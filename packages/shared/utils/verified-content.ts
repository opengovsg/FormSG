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

export const VerifiedKeyToFieldTitleMap: Record<
  VerifiedKeys,
  SPCPFieldTitle | SgidFieldTitle
> = {
  [VerifiedKeys.SpUinFin]: SPCPFieldTitle.SpNric,
  [VerifiedKeys.CpUen]: SPCPFieldTitle.CpUen,
  [VerifiedKeys.CpUid]: SPCPFieldTitle.CpUid,
  [VerifiedKeys.SgidUinFin]: SgidFieldTitle.SgidNric,
}

export type ParsedVerifiedKey = {
  baseKey: VerifiedKeys
  /** MRF step number from a `<key> (Step N)` suffix, if present. */
  stepNumber?: number
}

const VERIFIED_KEY_REGEX = new RegExp(
  `^(${CURRENT_VERIFIED_FIELDS.join('|')})(?: \\(Step (\\d+)\\))?$`,
)

/**
 * Parses a verifiedContent key, e.g. 'uinFin' or 'cpUen (Step 2)'.
 * @returns null if the key is not a known verified key
 */
export const parseVerifiedKey = (key: string): ParsedVerifiedKey | null => {
  const match = key.match(VERIFIED_KEY_REGEX)
  if (!match) return null
  const [, baseKey, step] = match
  return {
    baseKey: baseKey as VerifiedKeys,
    ...(step !== undefined ? { stepNumber: Number(step) } : {}),
  }
}

/**
 * Output title (also used as the synthetic field _id) for a parsed verified key.
 * Unsuffixed and Step 1 keys keep the legacy title for CSV/API compatibility;
 * later steps keep ` (Step N)` so respondents' identities stay distinct.
 */
export const getVerifiedFieldTitle = ({
  baseKey,
  stepNumber,
}: ParsedVerifiedKey): string => {
  const title = VerifiedKeyToFieldTitleMap[baseKey]
  return stepNumber !== undefined && stepNumber > 1
    ? `${title} (Step ${stepNumber})`
    : title
}
