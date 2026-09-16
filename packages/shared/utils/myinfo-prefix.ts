import { FormFieldDto, MyInfoAttribute } from '../types'

import type { FlattenedV1Response } from './flatten-v4-to-v1'

/**
 * The prefix storage mode prepends to a read-only MyInfo field's question text
 * (`formatMyInfoStorageResponseData` -> `getMyInfoPrefix`). The trailing space
 * is part of the value, not formatting applied at the call site.
 *
 * This is the single source of truth for the literal; the backend's
 * `MYINFO_PREFIX` re-exports it.
 */
export const MYINFO_QUESTION_PREFIX = '[Myinfo] '

/**
 * The shape both sides of the rule share: something carrying a field id and,
 * on a MyInfo field, the attribute it was prefilled from.
 */
type MyInfoPrefixCandidate = {
  _id: string
  myInfo?: { attr?: MyInfoAttribute } | null
}

/**
 * The rule, in one place: prefix iff the field carries a MyInfo attribute
 * **and** its id is in the read-only set.
 *
 * The read-only set is per respondent, per form — a MyInfo attribute is
 * read-only only when MyInfo returned it as government-verified and available
 * for this person, so it cannot be derived from the form definition.
 *
 * Note this is deliberately narrower than the backend's `getMyInfoPrefix`,
 * which also matches a Children field by `startsWith` over the hash keys.
 * Children is out of scope for MRF, and the email path still needs that branch.
 */
export const shouldPrefixMyInfoQuestion = (
  field: MyInfoPrefixCandidate,
  readOnlyFieldIds: ReadonlySet<string>,
): boolean => !!field.myInfo?.attr && readOnlyFieldIds.has(field._id)

const asSet = (readOnlyFieldIds: Iterable<string>): ReadonlySet<string> =>
  readOnlyFieldIds instanceof Set ? readOnlyFieldIds : new Set(readOnlyFieldIds)

/**
 * Prefixes `question` on the flattened V1 entries destined for the wire, so an
 * MRF V1 payload carries the same question text a storage-mode form would have
 * sent for the same read-only MyInfo fields. `question` is a consumer's join
 * key and the CSV column name, so this is a compatibility requirement.
 *
 * Pure: returns new objects and mutates neither the array nor its entries.
 * `question` is rewritten in place within each object, so key order — which
 * byte parity depends on — is preserved.
 */
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

/**
 * The same rule applied to a form-definition snapshot's `title`, for the two
 * admin surfaces. MRF derives its question text client-side from the
 * snapshotted `form_fields` titles, so prefixing the titles the backend serves
 * puts the prefix into the CSV header and the individual response page without
 * any frontend change.
 *
 * Applied when *serving*, never when snapshotting: the stored snapshot is what
 * later workflow steps are rendered and validated against, and a step-2
 * respondent must not see `[Myinfo] Name` as their own field label.
 */
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
