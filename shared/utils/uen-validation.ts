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

  // Foreign Entities
  'UF' 
])

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

/**
 * @param number Helper for business checksum
 * @returns 
 */
const calc_business_check_digit = (number: string): string =>{
  const weights = [10, 4, 9, 3, 8, 2, 7, 1]
  const alpha = 'XMKECAWLJDB'.split('')
  const num_list = number.split('')
  let sum = 0

  for (let i = 0; i < weights.length; i ++){
    sum += parseInt(num_list[i]) * weights[i]
  }
  return alpha[sum % 11]
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
 * @param number Helper for local company checksum
 * @returns 
 */
const calc_local_company_check_digit = (number: string): string =>{
  const weights = [10, 8, 6, 4, 9, 7, 5, 3, 1]
  const alpha = 'ZKCMDNERGWH'.split('')
  const num_list = number.split('')
  let sum = 0

  for (let i = 0; i < weights.length; i ++){
    sum += parseInt(num_list[i]) * weights[i]
  }
  return alpha[sum % 11]
}

/**
 * Helper for local UEN. Validation baed on local company based (ROC) number
 * @param number 
 * @returns number if local company UEN
 */
const validate_local_company = (number: string): string =>{
  if (!isNumeric(number.slice(-1))){
    return ""
  }
   let current_year = new Date().getFullYear()
  if (parseInt(number.slice(0, 4)) > current_year){
    return ""
  }
  if (number.slice(-1) !== calc_local_company_check_digit(number)){
    return ""
  }
  return number
}

/**
 * @param number Helper for others checksum
 * @returns 
 */
const calc_other_check_digit = (number: string): string =>{
  const weights = [4, 3, 5, 3, 10, 2, 2, 5, 7]
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWX0123456789'.split('')
  const num_list = number.split('')
  let sum = 0

  for (let i = 0; i < weights.length; i ++){
    let n = num_list[i]
    sum += alpha.indexOf(n) * weights[i]
  }

  return alpha[(sum - 5) % 11]
}

/**
 * Helper for other UEN. Performs validation based on UEN in
 * VALID_ENTITY_TYPE_INDICATORS
 * @param number 
 * @returns number if other UEN
 */
const validate_other = (number: string): string =>{
  let rst = ['R', 'S', 'T'] 
  if (rst.indexOf(number.slice(0)) === -1){
    return ""
  }
  if (!isNumeric(number.slice(1,3))){
    return ""
  }
  let curr_year = parseInt(new Date().getFullYear().toString().substring(-2))
  let uen_year = parseInt(number.slice(1,3))
  if (number.slice(0) === 'T' && uen_year > curr_year){
    return ""
  }
  if (!VALID_ENTITY_TYPE_INDICATORS.has(number.slice(3,5))){
    return ""
  }
  if (!isNumeric(number.slice(5,-1))){
    return ""
  }
  if (number.slice(-1) !== calc_other_check_digit(number)){
    return ""
  }
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

export const isUenValid = (uen: string): boolean => {
  uen = standardise(uen)
  if (validate(uen) === uen){
    return true
  } 

  return false
}

export { };