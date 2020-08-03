const isOneOfOptions = (fieldOptions, answer) => {
  const isValid = fieldOptions.includes(answer)
  return isValid
}

const isOtherOption = (othersRadioButton, answer) => {
  if (!othersRadioButton) {
    return false
  }
  const othersText = 'Others: '
  const isValid =
    String(answer).startsWith(othersText) &&
    String(answer).trim().length > othersText.length // not a blank answer
  return isValid
}

module.exports = {
  isOneOfOptions,
  isOtherOption,
}
