const checkMissingElement = (actual: string[], expected: Set<string>) => {
  return actual.some((option) => !expected.has(option))
}

export const checkIsOptionsMismatched = (
  optionsToRecipientsMapOptions: string[],
  selectedConditionalFieldOptions: string[],
) => {
  return (
    checkMissingElement(
      optionsToRecipientsMapOptions,
      new Set<string>(selectedConditionalFieldOptions),
    ) ||
    checkMissingElement(
      selectedConditionalFieldOptions,
      new Set<string>(optionsToRecipientsMapOptions),
    )
  )
}
