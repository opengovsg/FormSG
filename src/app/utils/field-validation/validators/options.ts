/**
 * Helper function to check if answer exists in fieldOptions
 */
export const isOneOfOptions = (
  fieldOptions: string[],
  answer: string,
): boolean => {
  return fieldOptions.includes(answer)
}

/**
 * Helper function to check if answer is a valid 'others' option
 */
export const isOtherOption = (
  othersRadioButton: boolean,
  answer: string,
): boolean => {
  if (!othersRadioButton) {
    return false
  }
  const othersText = 'Others: '
  return (
    answer.startsWith(othersText) && answer.trim().length > othersText.length // not a blank answer
  )
}
