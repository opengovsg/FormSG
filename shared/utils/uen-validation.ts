/**
 * Validate entity-type indicators, as per
 * https://www.uen.gov.sg/ueninternet/faces/pages/admin/aboutUEN.jspx and additional input
 */
const VALID_ENTITY_TYPE_INDICATORS = new Set([
  // ACRA
  'BN',
  'LP',
  'LL',
  'LC',
  'FC',
  'PF',
  'VC',

  // ESG
  'RF',

  // Muis
  'MQ',
  'MM',

  // MCI
  'NB',

  // MCCY
  'CC',
  'CS',
  'MB',

  // Mindef
  'FM',

  // MOE
  'GS',
  'EC',

  // MFA
  'DP',
  'CP',
  'NR',

  // MOH
  'CM',
  'CD',
  'MD',
  'HS',
  'VH',
  'CH',
  'MH',
  'CL',
  'XL',
  'CX',
  'HC',

  // MLAW
  'RP',

  // MOM
  'TU',

  // MND
  'TC',

  // MAS
  'FB',
  'FN',
  'FS',

  // PA
  'PA',
  'PB',

  // ROS
  'SS',

  // SLA
  'MC',
  'SM',

  // SNDGO
  'GA',
  'GB',
])

/**
 * Helper to check whether a string is numeric
 * @param s String
 * @returns True if string is numeric
 */
const isNumeric = (s: string): boolean => !!s.match(/^[0-9]+$/)

/**
 * Helper to check whether a string is alphabetic
 * @param s string
 * @returns True if string is alphabetic
 */
const isAlphabetic = (s: string): boolean => !!s.match(/^[a-zA-Z]+$/)

/**
 * Validates whether a provided string value adheres to the UIN/FIN format
 * as provided on the Singapore Government's National Registration Identity Card.
 * @param value The value to be validated
 */
export const isUenValid = (uen: string): boolean => {
  // allow lowercase strings
  uen = uen.toUpperCase()

  // check if uen is 9 or 10 digits
  if (uen.length < 9 || uen.length > 10) {
    return false
  }

  // (A) Businesses registered with ACRA
  if (uen.length === 9) {
    // check that last character is a letter
    const lastChar = uen[uen.length - 1]
    if (!isAlphabetic(lastChar)) {
      return false
    }

    // check that first 8 letters are all numbers
    const first8Chars = uen.slice(0, 8)
    if (!isNumeric(first8Chars)) {
      return false
    }

    // (A) Businesses registered with ACRA (SUCCESS)
    return true
  }

  // Length is 10
  // check that last character is a letter
  const lastChar = uen[uen.length - 1]
  if (!isAlphabetic(lastChar)) {
    return false
  }

  // (B) Local companies registered with ACRA
  const first4Chars = uen.slice(0, 4)
  if (isNumeric(first4Chars)) {
    // if first 4 are digits then next 5 must be digits too
    const next5Chars = uen.slice(4, 9)
    return isNumeric(next5Chars)
  }

  // (C) All other entities which will be issued new UEN
  // check that 1st letter is either T or S or R
  const firstChar = uen[0]
  if (!['T', 'S', 'R'].includes(firstChar)) {
    return false
  }

  // check that 2nd and 3rd letters are numbers only
  const chars2And3 = uen.slice(1, 3)
  if (!isNumeric(chars2And3)) {
    return false
  }

  // check entity-type indicator
  const entityTypeIndicator = uen.slice(3, 5)
  if (!VALID_ENTITY_TYPE_INDICATORS.has(entityTypeIndicator)) {
    return false
  }

  // check that 6th to 9th letters are numbers only
  const chars5To8 = uen.slice(5, 9)
  return isNumeric(chars5To8)
}
