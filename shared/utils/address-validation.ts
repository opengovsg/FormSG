export const validatePostalCode = (value: string) => {
  if (!/^[0-9]+$/.test(value) || value.length !== 6) {
    return false
  }
  return true
}

export const validateNoSpecialCharacters = (value: string) => {
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return false
  }
  return true
}

export const validateNoNonNumerical = (value: string) => {
  if (!/^[0-9]+$/.test(value)) {
    return false
  }
  return true
}

export const validateLevelUnit = (firstNumber: string, otherNumber: string) => {
  if ((!firstNumber && !otherNumber) || (firstNumber && otherNumber))
    return true
  return !!firstNumber
}
