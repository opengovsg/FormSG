/**
 * Function formats given number to its ordinal form.
 * @example 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", etc.
 * @param number the number to format
 * @returns the ordinal string of the number
 */
export const formatOrdinal = (number: number): string => {
  const englishOrdinalRules = new Intl.PluralRules('en', {
    type: 'ordinal',
  })
  const suffixes = {
    zero: 'th',
    one: 'st',
    two: 'nd',
    few: 'rd',
    many: 'th',
    other: 'th',
  }
  const suffix = suffixes[englishOrdinalRules.select(number)]
  return number + suffix
}
