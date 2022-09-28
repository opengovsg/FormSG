const PURE_NUMBER_REGEXP = new RegExp('^[+-][0-9]+')
const FORMULA_INJECTION_REGEXP = new RegExp('^[+=@-].*')

export const processFormulaInjectionText = (input: string): string => {
  // Check if input is a pure number
  const isPureNumber = PURE_NUMBER_REGEXP.test(input)
  // Check if input starts with formula characters
  const hasFormulaChars = FORMULA_INJECTION_REGEXP.test(input)
  // if the input is not a pure number, and starts with formula characters,
  // prefix it with a single quote to prevent formula injection
  if (hasFormulaChars && !isPureNumber) {
    return `'${input}`
  } else {
    return input
  }
}
