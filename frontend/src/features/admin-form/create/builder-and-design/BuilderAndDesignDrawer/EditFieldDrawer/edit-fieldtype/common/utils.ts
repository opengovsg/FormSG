export const getButtonText = (isPendingField: boolean) =>
  isPendingField ? 'Create' : 'Save'

export const SPLIT_TEXTAREA_TRANSFORM = {
  input: (optsArr: string[]) => optsArr.filter(Boolean).join('\n'),
  output: (optsString: string) =>
    optsString
      .split('\n')
      .map((opt) => opt.trim())
      .filter(Boolean),
}

export const SPLIT_TEXTAREA_VALIDATION = {
  validate: (opts: string) => {
    const optsArr = SPLIT_TEXTAREA_TRANSFORM.output(opts)
    return (
      new Set(optsArr).size === optsArr.length ||
      'Please remove duplicate options.'
    )
  },
}

/**
 * NumberInput value is a string by default, and normally we
 * want to convert it to a number. However, when it is empty,
 * react-hook-form doesn't behave correctly if we pass null
 * or undefined, so we need to pass an empty string.
 * @param val Raw value from NumberInput
 * @returns Empty string to clear input, or a valid number
 */
export const toNumberInput = (val: string): number | '' => {
  const cleanValue = val.replace(/\D/g, '')
  if (!cleanValue) return ''
  return parseInt(cleanValue)
}
