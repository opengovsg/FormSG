import { MAX_ATTACHMENT_NAME_BYTES } from '../constants/attachment'

import { hasControlCharacters } from './file-validation'

export const getMultiAttachmentZipName = (questionNumber: number): string =>
  `Question ${questionNumber}.zip`

export const getAttachmentDownloadPrefix = (questionNumber: number): string =>
  `Question ${questionNumber} - `

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

/** Windows and macOS ignore case, and macOS ignores Unicode normalization, in file names, so these names clash once unzipped */
export const findClashingFileName = (names: string[]): string | undefined => {
  const seen = new Set<string>()
  return names.find((name) => {
    const key = toSafeZipEntryName(name).normalize('NFC').toLowerCase()
    if (!key || seen.has(key)) return true
    seen.add(key)
    return false
  })
}

export const findInvalidFileName = (names: string[]): string | undefined =>
  names.find(
    (name) =>
      hasControlCharacters(name) ||
      new TextEncoder().encode(name).length > MAX_ATTACHMENT_NAME_BYTES,
  )
