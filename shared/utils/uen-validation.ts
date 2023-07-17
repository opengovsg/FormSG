/**
 * Validate entity-type indicators, as per
 * https://www.uen.gov.sg/ueninternet/faces/pages/admin/aboutUEN.jspx
 * https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Singapore-TIN.pdf
 * 
 * with code modified from https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py
 * See credits.md for details on copyright
 */


/** General Comments:
 * 
 * Type indicators created as a const Set<string>(). Maintain by adding new 
 * codes here. 
 * 
 * Arrow helper functions:
 * standardise -> convert to uppercase and remove whitespace
 * isNumeric and isAlphabetic are self explanatory.  
 *
 * isUenValid is a wrapper over the validate function that serves as an 
 * orchestrater for subsequent function calls. validate parses UEN and evaluates 
 * if UEN is Business UEN based on ROB, Local Comany UEN based on ROC, or Other 
 * UEN. 
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
const upperCaseAndTrim = (s: string): string => s.toUpperCase().trim()

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
 * Helper for business checksum
 * @param number 
 * @returns 
 */
const calcBusinessCheckDigit = (number: string): string =>{
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
 * @returns true if valid Business UEN
 */
const validateBusiness = (number: string): boolean  =>{

  const first8Char =  number.slice(0, -1)
  if (!isNumeric(first8Char)){
    return false
  } 

  const checkSum =  number.slice(-1)
  if (!isAlphabetic(checkSum)){
    return false
  }
  
  if (checkSum !== calcBusinessCheckDigit(number)){
    return false
  }
  return true
}

/**
 * Helper for local company checksum
 * @param number 
 * @returns 
 */
const calcLocalCompanyCheckDigit = (number: string): string =>{
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
 * @returns true if valid local company UEN
 */
const validateLocalCompany = (number: string): boolean =>{
  
  const first9Char =  number.slice(0, -1)
  if (!isNumeric(first9Char)){
    return false
  }

   let currentYear = new Date().getFullYear()
   const first4Char =  number.slice(0, 4)
   if (parseInt(first4Char) > currentYear){
    return false
  }

  const checkSum =  number.slice(-1)
  if (checkSum !== calcLocalCompanyCheckDigit(number)){
    return false
  }
  return true
}

/**
 * Helper for others checksum
 * @param number 
 * @returns 
 */
const calcOtherCheckDigit = (number: string): string =>{
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
 * @returns true if valid UEN
 */
const validateOther = (number: string): boolean =>{
  const uenPrefix = ['R', 'S', 'T']
  const firstChar =  number.slice(0,1)
  if (!uenPrefix.includes(firstChar)){
    return false
  }

  const chars2And3 = number.slice(1,3)
  if (!isNumeric(chars2And3)){
    return false
  }
 
  let currentYear = parseInt(new Date().getFullYear().toString().substring(-2))
  let uenYear = parseInt(number.slice(1,3))
  if (number.slice(0,1) === 'T' && uenYear > currentYear){
    return false
  }

  const chars4And5 = number.slice(3,5)
  if (!VALID_ENTITY_TYPE_INDICATORS.has(chars4And5)){
    return false
  }

  const chars6To9 = number.slice(5,-1)
  if (!isNumeric(chars6To9)){
    return false
  }

  const checkSum = number.slice(-1)
  if (checkSum !== calcOtherCheckDigit(number)){
    return false
  }
  return true
}

/**
 * Heart of the validation function. Parses given UEN and decide which function 
 * to call base on the perceived UEN type. 
 * 
 * Business UEN based on ROB 
 * Local Comany UEN based on ROC
 * Other UEN.
 *  
 * @param uen string that represents the UEN
 * @returns true if UEN is valid
 */
const isUenValid = (uen: string): boolean => {
  let number = upperCaseAndTrim(uen)
  if (number.length !== 9 && number.length !== 10){
    return false
  } 

  if (number.length === 9){
    return validateBusiness(number)
  }
  
  if (isNumeric(number.slice(0,1))){
    return validateLocalCompany(number)
  }
  
  return validateOther(number)
}

export {isUenValid}

