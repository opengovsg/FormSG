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

const myInfoAttrOf = (
  field: MyInfoSnapshotField,
): MyInfoAttribute | undefined =>
  'myInfo' in field ? field.myInfo?.attr : undefined

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

  const readOnlyAttrs = new Set(Object.keys(hashesResult.value))
  const readOnlyFieldIds = mapMyInfoAttrsToSnapshotFieldIds({
    readOnlyAttrs,
    formFields,
    responses,
  })

  if (readOnlyAttrs.size > 0 && readOnlyFieldIds.length === 0) {
    logger.info({
      message: 'No snapshot field matched any read-only MyInfo attribute',
      meta: { ...logMeta, numReadOnlyAttrs: readOnlyAttrs.size },
    })
  }

  return readOnlyFieldIds
}
