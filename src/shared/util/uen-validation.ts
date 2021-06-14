/**
 * Validates whether a provided string value adheres to the UIN/FIN format
 * as provided on the Singapore Government's National Registration Identity Card.
 * @param value The value to be validated
 */
export const isUenValid = (value: string): boolean => {
  return validateUEN(value)
}

/**
 * validates UEN of businesses in Singapore
 * https://www.uen.gov.sg/ueninternet/faces/pages/admin/aboutUEN.jspx
 * https://gist.github.com/mervintankw/90d5660c6ab03a83ddf77fa8199a0e52
 * @param {string} uen
 * @returns {boolean}
 */
function validateUEN(uen: string) {
  const entityTypeIndicator = [
    'LP',
    'LL',
    'FC',
    'PF',
    'RF',
    'MQ',
    'MM',
    'NB',
    'CC',
    'CS',
    'MB',
    'FM',
    'GS',
    'GA',
    'GB',
    'DP',
    'CP',
    'NR',
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
    'RP',
    'TU',
    'TC',
    'FB',
    'FN',
    'PA',
    'PB',
    'SS',
    'MC',
    'SM',
  ]

  // check that uen is not empty
  if (!uen || String(uen) === '') {
    return false
  }

  // check if uen is 9 or 10 digits
  if (uen.length < 9 || uen.length > 10) {
    return false
  }

  uen = uen.toUpperCase()
  const uenStrArray: any[] = uen.split('')

  // (A) Businesses registered with ACRA
  if (uenStrArray.length === 9) {
    // check that last character is a letter
    if (!isNaN(uenStrArray[uenStrArray.length - 1])) {
      return false
    }

    for (let i = 0; i < uenStrArray.length - 1; i++) {
      // check that first 8 letters are all numbers
      if (isNaN(uenStrArray[i])) {
        return false
      }
    }

    // (A) Businesses registered with ACRA (SUCCESS)
    return true
  } else if (uenStrArray.length === 10) {
    // check that last character is a letter
    if (!isNaN(uenStrArray[uenStrArray.length - 1])) {
      return false
    }

    // (B) Local companies registered with ACRA
    if (
      !isNaN(uenStrArray[0]) &&
      !isNaN(uenStrArray[1]) &&
      !isNaN(uenStrArray[2]) &&
      !isNaN(uenStrArray[3])
    ) {
      // check that 5th to 9th letters are all numbers
      if (
        !isNaN(uenStrArray[4]) &&
        !isNaN(uenStrArray[5]) &&
        !isNaN(uenStrArray[6]) &&
        !isNaN(uenStrArray[7]) &&
        !isNaN(uenStrArray[8])
      ) {
        // (B) Local companies registered with ACRA (SUCCESS)
        return true
      } else {
        return false
      }
    }
    // (C) All other entities which will be issued new UEN
    else {
      // check that 1st letter is either T or S or R
      if (
        uenStrArray[0] !== 'T' &&
        uenStrArray[0] !== 'S' &&
        uenStrArray[0] !== 'R'
      ) {
        return false
      }

      // check that 2nd and 3rd letters are numbers only
      if (isNaN(uenStrArray[1]) || isNaN(uenStrArray[2])) {
        return false
      }

      // check that 4th letter is an alphabet
      if (!isNaN(uenStrArray[3])) {
        return false
      }

      // check entity-type indicator
      let entityTypeMatch = false
      const entityType = String(uenStrArray[3]) + String(uenStrArray[4])
      for (let i = 0; i < entityTypeIndicator.length; i++) {
        if (String(entityTypeIndicator[i]) === String(entityType)) {
          entityTypeMatch = true
        }
      }
      if (!entityTypeMatch) {
        return false
      }

      // check that 6th to 9th letters are numbers only
      if (
        isNaN(uenStrArray[5]) ||
        isNaN(uenStrArray[6]) ||
        isNaN(uenStrArray[7]) ||
        isNaN(uenStrArray[8])
      ) {
        return false
      }

      // (C) All other entities which will be issued new UEN (SUCCESS)
      return true
    }
  }

  return false
}
