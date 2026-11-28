import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from 'formsg-shared/types/field'

const UNSAFE_ZIP_NAME_CHARACTERS = /[/\\:*?"<>|]/g

const MAX_FOLDER_NAME_ANSWER_LENGTH = 50

export const FOLDER_NAME_FIELD_TYPES: BasicField[] = [
  BasicField.ShortText,
  BasicField.Email,
  BasicField.Nric,
  BasicField.Number,
  BasicField.Mobile,
  BasicField.Dropdown,
  BasicField.Date,
]

const truncateToCodePoints = (text: string, max: number): string =>
  Array.from(text).slice(0, max).join('')

export const toSafeZipEntryName = (name: string): string =>
  name.replace(UNSAFE_ZIP_NAME_CHARACTERS, '')

export const getFolderNameAnswer = (
  responses: FormField[] | undefined,
  fieldId: string | undefined,
): string | undefined =>
  fieldId ? responses?.find(({ _id }) => _id === fieldId)?.answer : undefined

export const getResponseFolderName = ({
  refNo,
  answer = '',
}: {
  refNo: string
  answer?: string
}): string => {
  const cleanAnswer = truncateToCodePoints(
    answer.replace(UNSAFE_ZIP_NAME_CHARACTERS, ' ').replace(/\s+/g, ' ').trim(),
    MAX_FOLDER_NAME_ANSWER_LENGTH,
  ).trim()
  return cleanAnswer ? `${cleanAnswer} - RefNo ${refNo}` : `RefNo ${refNo}`
}
