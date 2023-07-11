/**
 * Validate entity-type indicators, as per
 * https://www.uen.gov.sg/ueninternet/faces/pages/admin/aboutUEN.jspx
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Singapore-TIN.pdf
 * 
 * with code modified from https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py
 * See credits.md for details on copyright
 */


/** Comments:
 * 
 * Type indicators created as a const Set<string>(). Maintain by adding new 
 * codes here. 
 * 
 * Arrow helper functions:
 * standardise -> convert to uppercase and remove whitespace
 * isNumeric and isAlphabetic are self explanatory.  
 *
 * isUenValid is a wrapper over core validate function that mimics 
 * Core function returns boolean 
 * 
 * Error Handling: 
 * All invalid UEN numbers will returned an empty string that will be 
 * percolated upwards to the isUenValid wrapper function, which will in turn 
 * return false, thereby invalidating the UEN. 
 * 
 * The intent is unknown but I have kept to the original format of using 
 * function expressions instead of function statements. I have also kept the 
 * original format of using arrow functions as helpers but we might want to 
 * consider refactoring them into functions for better readability and code
 * organisation.  
 *  
 */

const VALID_ENTITY_TYPE_INDICATORS = new Set<string>([
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


// def calc_business_check_digit(number):
//     """Calculate the check digit for the Business (ROB) number."""
//     number = compact(number)
//     weights = (10, 4, 9, 3, 8, 2, 7, 1)
//     return 'XMKECAWLJDB'[sum(int(n) * w for n, w in zip(number, weights)) % 11]


// def _validate_business(number):
//     """Perform validation on UEN - Business (ROB) numbers."""
//     if not isdigits(number[:-1]):
//         raise InvalidFormat()
//     if not number[-1].isalpha():
//         raise InvalidFormat()
//     if number[-1] != calc_business_check_digit(number):
//         raise InvalidChecksum()
//     return number


// def calc_local_company_check_digit(number):
//     """Calculate the check digit for the Local Company (ROC) number."""
//     number = compact(number)
//     weights = (10, 8, 6, 4, 9, 7, 5, 3, 1)
//     return 'ZKCMDNERGWH'[sum(int(n) * w for n, w in zip(number, weights)) % 11]


// def _validate_local_company(number):
//     """Perform validation on UEN - Local Company (ROC) numbers."""
//     if not isdigits(number[:-1]):
//         raise InvalidFormat()
//     current_year = str(datetime.now().year)
//     if number[:4] > current_year:
//         raise InvalidComponent()
//     if number[-1] != calc_local_company_check_digit(number):
//         raise InvalidChecksum()
//     return number


// def calc_other_check_digit(number):
//     """Calculate the check digit for the other entities number."""
//     number = compact(number)
//     alphabet = 'ABCDEFGHJKLMNPQRSTUVWX0123456789'
//     weights = (4, 3, 5, 3, 10, 2, 2, 5, 7)
//     return alphabet[(sum(alphabet.index(n) * w for n, w in zip(number, weights)) - 5) % 11]


// def _validate_other(number):
//     """Perform validation on other UEN numbers."""
//     if number[0] not in ('R', 'S', 'T'):
//         raise InvalidComponent()
//     if not isdigits(number[1:3]):
//         raise InvalidFormat()
//     current_year = str(datetime.now().year)
//     if number[0] == 'T' and number[1:3] > current_year[2:]:
//         raise InvalidComponent()
//     if number[3:5] not in OTHER_UEN_ENTITY_TYPES:
//         raise InvalidComponent()
//     if not isdigits(number[5:-1]):
//         raise InvalidFormat()
//     if number[-1] != calc_other_check_digit(number):
//         raise InvalidChecksum()
//     return number


// def validate(number): DONE
//     """Check if the number is a valid Singapore UEN number."""
//     number = compact(number)
//     if len(number) not in (9, 10):
//         raise InvalidLength()
//     if len(number) == 9:
//         return _validate_business(number)
//     if isdigits(number[0]):
//         return _validate_local_company(number)
//     return _validate_other(number)


// def is_valid(number): DONE
//     """Check if the number is a valid Singapore UEN number."""
//     try:
//         return bool(validate(number))
//     except ValidationError:
//         return False


// def format(number): DONE
//     """Reformat the number to the standard presentation format."""
//     return compact(number)





/**
 * Helper to standardise format - uppercase and without whitespace  
 * @param s String
 * @returns True if string is numeric
 */
const standardise = (s: string): string => s.toUpperCase().trim()

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

const calc_business_check_digit = (number: string): string =>{
  
  return ""
}

/**
 * Helper for Business UEN. 
 * Performs validation based on Business (ROB) numbers
 * @param number 
 * @returns number if Business UEN
 */
const validate_business = (number: string): string  =>{
  if (!isNumeric(number.slice(0,-1))){
    return ""
  } 
  if (!isAlphabetic(number.slice(-1))){
    return ""
  }
  if (number.slice(-1) !== calc_business_check_digit(number)){
    return ""
  }
  return number
}

/**
 * Helper for local UEN. Validation baed on local company based (ROC) number
 * @param number 
 * @returns number if local company UEN
 */
const validate_local_company = (number: string): string =>{
  return number
}

/**
 * Helper for other UEN. Performs validation based on UEN in
 * VALID_ENTITY_TYPE_INDICATORS
 * @param number 
 * @returns number if other UEN
 */
const validate_other = (number: string): string =>{
  return number
}

/**
 * Validates whether a provided string value adheres to the UIN/FIN format
 * as provided on the Singapore Government's National Registration Identity Card.
 * @param number The value to be validated
 */
export const validate = (number: string): string => {

  number = standardise(number)

  if (number.length !== 9 && number.length !== 10){
    return ""
  } 

  if (number.length === 9){
    return validate_business(number)
  }

  if (isNumeric(number.slice(0))){
    return validate_local_company(number)
  }

  return validate_other(number)

}


/**
 * old
 */
export const oldvalidate = (uen: string): string => {
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

export const isUenValid = (uen: string): boolean => {
  uen = standardise(uen)
  if (validate(uen) === uen){
    return true
  } 

  return false
}

export { };