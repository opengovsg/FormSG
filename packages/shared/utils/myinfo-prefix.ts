import { CorppassAttribute, MyInfoAttribute } from '../types'

import type { FlattenedV1Response } from './flatten-v4-to-v1'

export const MYINFO_QUESTION_PREFIX = '[Myinfo] '

type MyInfoPrefixCandidate = {
  _id: string
  myInfo?: { attr?: MyInfoAttribute } | null
  corppass?: { attr?: CorppassAttribute } | null
}

/**
 * The prefix for a verified answer: `[Myinfo] ` for a MyInfo field or a login
 * identity field, Singpass or Corppass, and none when the answer was not
 * verified. Corppass fields share the prefix as Corppass moves to Myinfo
 * business.
 */
export const getVerifiedQuestionPrefix = (
  field: MyInfoPrefixCandidate,
  readOnlyFieldIds: ReadonlySet<string>,
): string => {
  if (!readOnlyFieldIds.has(String(field._id))) return ''
  return field.myInfo?.attr || field.corppass?.attr
    ? MYINFO_QUESTION_PREFIX
    : ''
}

const asSet = (readOnlyFieldIds: Iterable<string>): ReadonlySet<string> =>
  new Set(Array.from(readOnlyFieldIds, String))

/**
 * @param formFields the form's fields. Needed to mark Corppass answers: V1
 * entries copy `myInfo` but not `corppass`, to match storage mode exactly, so
 * an entry alone can't tell a Corppass identity answer apart. Without it,
 * Corppass answers get no prefix.
 */
export const applyMyInfoPrefix = (
  v1Fields: readonly FlattenedV1Response[],
  readOnlyFieldIds: Iterable<string>,
  formFields: readonly MyInfoPrefixCandidate[] = [],
): FlattenedV1Response[] => {
  const readOnly = asSet(readOnlyFieldIds)
  const fieldsById = new Map(
    formFields.map((field) => [String(field._id), field]),
  )
  return v1Fields.map((entry) => {
    const prefix = getVerifiedQuestionPrefix(
      fieldsById.get(String(entry._id)) ?? entry,
      readOnly,
    )
    return prefix ? { ...entry, question: `${prefix}${entry.question}` } : entry
  })
}

export const applyMyInfoPrefixToFormFields = <
  F extends MyInfoPrefixCandidate & { title: string },
>(
  formFields: readonly F[],
  readOnlyFieldIds: Iterable<string>,
): F[] => {
  const readOnly = asSet(readOnlyFieldIds)
  return formFields.map((field) => {
    const prefix = getVerifiedQuestionPrefix(field, readOnly)
    return prefix ? { ...field, title: `${prefix}${field.title}` } : field
  })
}
