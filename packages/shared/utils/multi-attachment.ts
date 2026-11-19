export const getMultiAttachmentZipName = (questionNumber: number): string =>
  `Question ${questionNumber}.zip`

export const formatAttachmentAnswer = ({
  answer,
  answerArray,
}: {
  answer?: string
  answerArray?: unknown[]
}): string => answerArray?.join(';') ?? answer ?? ''

const UNSAFE_ZIP_NAME_CHARACTERS = /[/\\:*?"<>|]/g

export const toSafeZipEntryName = (name: string): string =>
  name.replace(UNSAFE_ZIP_NAME_CHARACTERS, '')

/** Downloads drop unsafe characters and most computers ignore case, so these names clash */
export const findClashingFileName = (names: string[]): string | undefined => {
  const seen = new Set<string>()
  return names.find((name) => {
    const key = toSafeZipEntryName(name).toLowerCase()
    if (!key || seen.has(key)) return true
    seen.add(key)
    return false
  })
}
