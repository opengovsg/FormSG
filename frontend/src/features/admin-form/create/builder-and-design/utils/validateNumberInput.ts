/**
 * Validates the input given to Chakra's NumberInput component. Pass this to the
 * onChange parameter for NumberInput. Calls onChange('') if the input is empty,
 * onChange(number) if the input is a number, and does nothing if the input is
 * invalid.
 * @param onChange react Component onChange
 * @param valStr input value as string
 * @param valNum input value as number (can be NaN!)
 * @returns void
 */
export const validateNumberInput = (
  onChange: (...event: any[]) => void,
  valStr: string,
  valNum: number,
): void => {
  if (!valStr) {
    onChange('')
    return
  }
  if (isNaN(valNum)) return
  onChange(valNum)
}
