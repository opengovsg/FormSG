const NUMBERS_ONLY_REGEXP = /^[+.\d-]+$/
const FORMULA_INJECTION_REGEXP = /^[+=@-]/

export const processFormulaInjectionText = (input: string): string => {
  // Check if input contains only + | - | digits
  const hasNumbersOnly = NUMBERS_ONLY_REGEXP.test(input)
  // Check if input starts with formula characters
  const hasFormulaChars = FORMULA_INJECTION_REGEXP.test(input)
  // if the input is not a pure number, and starts with formula characters,
  // prefix it with a single quote to prevent formula injection
  if (hasFormulaChars && !hasNumbersOnly) {
    return `'${input}`
  } else {
    return input
  }
}
