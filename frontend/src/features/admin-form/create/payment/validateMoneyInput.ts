/**
 * Validates the input given to the NumberInput component to be currency. Pass
 * this to the onChange parameter for NumberInput. We first split the valStr by
 * the '.' character. Handles the following cases in order:
 * - If the length of the resulting array is more than or equals to 2, return
 *   the amount conveyed by the first '.' and using only 2 decimal places.
 * - Else, return onChange(valStr).
 *
 * @example
 *  <NumberInput
 *    ...
 *    onChange={validateMoneyInput(onChange)}
 *  />
 * @param onChange react Component onChange
 * @param valStr input value as string
 * @returns void
 */
export const validateMoneyInput =
  (onChange: (...event: unknown[]) => void) =>
  (valStr: string): void => {
    // Can consider using Intl.NumberFormat (but it has weird behaviours due to rounding)
    const moneyParts = valStr.split('.')
    if (moneyParts.length >= 2) {
      if (moneyParts[1].length > 2) {
        return onChange(`${moneyParts[0]}.${moneyParts[1].slice(0, 2)}`)
      } else {
        return onChange(`${moneyParts[0]}.${moneyParts[1]}`)
      }
    } else {
      return onChange(valStr)
    }
  }
