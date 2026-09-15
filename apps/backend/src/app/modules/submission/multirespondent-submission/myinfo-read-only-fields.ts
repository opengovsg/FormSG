import {
  FormAuthType,
  FormFieldDto,
  MyInfoAttribute,
} from 'formsg-shared/types'

import { FormFieldSchema } from 'src/types'
import { ParsedClearFormFieldResponsesV4 } from 'src/types/api'

import { createLoggerWithLabel } from '../../../config/logger'
import { MyInfoService } from '../../myinfo/myinfo.service'

const logger = createLoggerWithLabel(module)

/**
 * A field the resolution can read, from either shape it arrives in: the
 * DTO-shaped snapshot of an in-flight submission, or the mongoose-shaped live
 * form definition on the create path.
 */
type MyInfoSnapshotField = FormFieldDto | FormFieldSchema

/** The MyInfo attribute a field was prefilled from, if it is a MyInfo field. */
const myInfoAttrOf = (
  field: MyInfoSnapshotField,
): MyInfoAttribute | undefined =>
  'myInfo' in field ? field.myInfo?.attr : undefined

/**
 * Maps MyInfo attributes onto the ids of the snapshot fields that carry them.
 *
 * The "has a V4 response present" clause mirrors storage mode's `isVisible`
 * clause in `hasMyInfoAnswer`, which is not vacuous: a MyInfo field hidden by
 * form logic still reaches the storage wire but is excluded from
 * `hashedFields`, so it gets no prefix. A read-only MyInfo field always
 * carries a prefilled value when visible, so "no V4 response" means hidden.
 */
const mapMyInfoAttrsToSnapshotFieldIds = ({
  readOnlyAttrs,
  formFields,
  responses,
}: {
  readOnlyAttrs: ReadonlySet<string>
  formFields: readonly MyInfoSnapshotField[]
  responses: ParsedClearFormFieldResponsesV4
}): string[] =>
  formFields
    .filter((field) => {
      const attr = myInfoAttrOf(field)
      return (
        !!attr &&
        readOnlyAttrs.has(attr) &&
        responses[String(field._id)] !== undefined
      )
    })
    .map((field) => String(field._id))

/**
 * The set of field ids whose answers were read-only MyInfo values for this
 * respondent on this form — the input to the `[Myinfo] ` question prefix that
 * storage mode applies and MRF has to reproduce.
 *
 * `Object.keys(hashes)` is exactly that set of *attributes*: `hashFieldValues`
 * writes a key only for a field that is read-only with a non-empty prefilled
 * value, and `updateHashes` stores that object as the record's `fields`. This
 * is a compatibility step, not a security one — there is no hash comparison
 * here and no new way to reject a submission.
 *
 * Deriving the set from the form definition instead is not possible:
 * read-only-ness is decided per respondent from what MyInfo returned, so a
 * static rule would silently over-prefix every attribute MyInfo commonly
 * returns as user-provided (mobile, address, occupation, employment).
 *
 * Logs, never fails: a missing hash record, or an attribute matching no
 * snapshot field, yields a shorter list and a log line, never an error.
 */
export const resolveMrfMyInfoReadOnlyFields = async ({
  uinFin,
  formId,
  authType,
  formFields,
  responses,
}: {
  uinFin: string
  formId: string
  authType: FormAuthType
  formFields: readonly MyInfoSnapshotField[]
  responses: ParsedClearFormFieldResponsesV4
}): Promise<string[]> => {
  // An MRF-specific action, so these lines are never mistaken for a
  // storage-mode MyInfo event.
  const logMeta = { action: 'resolveMrfMyInfoReadOnlyFields', formId, authType }

  const hashesResult = await MyInfoService.fetchMyInfoHashes(uinFin, formId)
  if (hashesResult.isErr()) {
    // Largely unreachable: the hash record's TTL is the MyInfo login cookie's
    // own lifetime, and MRF already rejects an expired login JWT upstream.
    logger.warn({
      message:
        'Could not read MyInfo hashes; MRF question text will carry no MyInfo prefix',
      meta: logMeta,
      error: hashesResult.error,
    })
    return []
  }

  const readOnlyAttrs = new Set(Object.keys(hashesResult.value))
  const readOnlyFieldIds = mapMyInfoAttrsToSnapshotFieldIds({
    readOnlyAttrs,
    formFields,
    responses,
  })

  if (readOnlyAttrs.size > 0 && readOnlyFieldIds.length === 0) {
    // Not necessarily wrong — the hash record can hold child-specific keys
    // that match no field's `myInfo.attr`, and every MyInfo field may be
    // hidden by form logic — but worth a line, since it is also what a
    // mapping bug looks like.
    logger.info({
      message: 'No snapshot field matched any read-only MyInfo attribute',
      meta: { ...logMeta, numReadOnlyAttrs: readOnlyAttrs.size },
    })
  }

  return readOnlyFieldIds
}
