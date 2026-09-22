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

type MyInfoSnapshotField = FormFieldDto | FormFieldSchema

const getMyInfoAttribute = (
  field: MyInfoSnapshotField,
): MyInfoAttribute | undefined => {
  const supportsMyInfo = 'myInfo' in field
  if (!supportsMyInfo) return undefined

  return field.myInfo?.attr
}

const mapMyInfoAttrsToSnapshotFieldIds = ({
  readOnlyAttributes,
  formFields,
  responses,
}: {
  readOnlyAttributes: ReadonlySet<string>
  formFields: readonly MyInfoSnapshotField[]
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
  const readOnlyFieldIds = mapMyInfoAttrsToSnapshotFieldIds({
    readOnlyAttributes,
    formFields,
    responses,
  })

  const hasReadOnlyAttributes = readOnlyAttributes.size > 0
  const hasMatchingFields = readOnlyFieldIds.length > 0
  if (hasReadOnlyAttributes && !hasMatchingFields) {
    logger.info({
      message: 'No snapshot field matched any read-only MyInfo attribute',
      meta: { ...logMeta, numReadOnlyAttrs: readOnlyAttributes.size },
    })
  }

  return readOnlyFieldIds
}
