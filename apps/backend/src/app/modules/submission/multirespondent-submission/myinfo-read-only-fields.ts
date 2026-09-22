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

type FormField = FormFieldDto | FormFieldSchema

/**
 * Returns the MyInfo attribute on a form field, or undefined when the
 * field does not carry MyInfo (plain respondent-typed fields, or a MyInfo
 * field whose attr was never set).
 */
const getMyInfoAttribute = (field: FormField): MyInfoAttribute | undefined => {
  const supportsMyInfo = 'myInfo' in field
  if (!supportsMyInfo) return undefined

  return field.myInfo?.attr
}

/**
 * Maps hash-verified MyInfo attributes onto the field IDs that
 * actually received a response.
 *
 * A field is included only when it is a MyInfo field, its attribute is in
 * `readOnlyAttributes`, and it appears in `responses` (hidden-by-logic
 * fields are omitted).
 */
const mapMyInfoAttrsToFieldIds = ({
  readOnlyAttributes,
  formFields,
  responses,
}: {
  readOnlyAttributes: ReadonlySet<string>
  formFields: readonly FormField[]
  responses: ParsedClearFormFieldResponsesV4
}): string[] =>
  formFields
    .filter((field) => {
      const myInfoAttribute = getMyInfoAttribute(field)
      const isMyInfoField = !!myInfoAttribute
      if (!isMyInfoField) return false

      const isReadOnlyAttribute = readOnlyAttributes.has(myInfoAttribute)
      if (!isReadOnlyAttribute) return false

      const fieldId = String(field._id)
      const hasSubmittedResponse = responses[fieldId] !== undefined
      return hasSubmittedResponse
    })
    .map((field) => String(field._id))

/**
 * Resolves the field IDs whose MyInfo values were verified for this
 * respondent, to persist as `myInfoReadOnlyFields`.
 *
 * Reads the MyInfo hash record for `(uinFin, formId)` and returns the
 * matching visible field IDs. Admin/webhook surfaces later prefix those
 * questions with `[Myinfo] `. Returns `[]` (and logs) when hashes cannot
 * be read, so the submission still succeeds and question text stays
 * unprefixed rather than failing the step.
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
  formFields: readonly FormField[]
  responses: ParsedClearFormFieldResponsesV4
}): Promise<string[]> => {
  const logMeta = { action: 'resolveMrfMyInfoReadOnlyFields', formId, authType }

  const hashesResult = await MyInfoService.fetchMyInfoHashes(uinFin, formId)
  if (hashesResult.isErr()) {
    logger.warn({
      message:
        'Could not read MyInfo hashes; MRF question text will carry no MyInfo prefix',
      meta: logMeta,
      error: hashesResult.error,
    })
    return []
  }

  const readOnlyAttributes = new Set(Object.keys(hashesResult.value))
  const readOnlyFieldIds = mapMyInfoAttrsToFieldIds({
    readOnlyAttributes,
    formFields,
    responses,
  })

  const hasReadOnlyAttributes = readOnlyAttributes.size > 0
  const hasMatchingFields = readOnlyFieldIds.length > 0
  if (hasReadOnlyAttributes && !hasMatchingFields) {
    logger.info({
      message: 'No form field matched any read-only MyInfo attribute',
      meta: { ...logMeta, numReadOnlyAttrs: readOnlyAttributes.size },
    })
  }

  return readOnlyFieldIds
}
