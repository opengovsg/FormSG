import { FormFieldDto, MyInfoAttribute } from '../types'

import type { FlattenedV1Response } from './flatten-v4-to-v1'

export const MYINFO_QUESTION_PREFIX = '[Myinfo] '

type MyInfoPrefixCandidate = {
  _id: string
  myInfo?: { attr?: MyInfoAttribute } | null
}

export const shouldPrefixMyInfoQuestion = (
  field: MyInfoPrefixCandidate,
  readOnlyFieldIds: ReadonlySet<string>,
): boolean => !!field.myInfo?.attr && readOnlyFieldIds.has(String(field._id))

const asSet = (readOnlyFieldIds: Iterable<string>): ReadonlySet<string> =>
  new Set(Array.from(readOnlyFieldIds, String))

export const applyMyInfoPrefix = (
  v1Fields: readonly FlattenedV1Response[],
  readOnlyFieldIds: Iterable<string>,
): FlattenedV1Response[] => {
  const readOnly = asSet(readOnlyFieldIds)
  return v1Fields.map((entry) =>
    shouldPrefixMyInfoQuestion(entry, readOnly)
      ? { ...entry, question: `${MYINFO_QUESTION_PREFIX}${entry.question}` }
      : entry,
  )
}

export const applyMyInfoPrefixToFormFields = <F extends FormFieldDto>(
  formFields: readonly F[],
  readOnlyFieldIds: Iterable<string>,
): F[] => {
  const readOnly = asSet(readOnlyFieldIds)
  return formFields.map((field) =>
    shouldPrefixMyInfoQuestion(field as MyInfoPrefixCandidate, readOnly)
      ? { ...field, title: `${MYINFO_QUESTION_PREFIX}${field.title}` }
      : field,
  )
}
