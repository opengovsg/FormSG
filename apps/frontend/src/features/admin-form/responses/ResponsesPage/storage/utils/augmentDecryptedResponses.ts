import { FieldResponsesV4, FieldResponseV4 } from '@opengovsg/formsg-sdk'
import type {
  EncryptedAttachmentRecords,
  FormField,
} from '@opengovsg/formsg-sdk/dist/types'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'

export type AugmentedDecryptedResponse = FormField & {
  questionNumber?: number
  downloadUrl?: string
}

type AugmentedFieldAccumulator = {
  fields: AugmentedDecryptedResponse[]
  nonResponseFieldsCount: number
}

const isBasicField = (test: string): test is BasicField => {
  return Object.values(BasicField).indexOf(test as BasicField) !== -1
}

export const augmentDecryptedResponses = (
  formFields: FormField[],
  attachmentMetadata: EncryptedAttachmentRecords,
): AugmentedDecryptedResponse[] => {
  const { fields } = formFields.reduce<AugmentedFieldAccumulator>(
    (acc, field, index) => {
      if (!isBasicField(field.fieldType)) return acc

      const fieldToAdd: AugmentedFieldAccumulator['fields'][number] = field

      if (NON_RESPONSE_FIELD_SET.has(field.fieldType)) {
        acc.nonResponseFieldsCount += 1
      } else {
        fieldToAdd.questionNumber = index + 1 - acc.nonResponseFieldsCount
      }

      if (attachmentMetadata[field._id]) {
        fieldToAdd.downloadUrl = attachmentMetadata[field._id]
      }

      acc.fields.push(fieldToAdd)
      return acc
    },
    { fields: [], nonResponseFieldsCount: 0 },
  )

  return fields
}

/** V4 augmentation */

export type AugmentedDecryptedResponseV4 = {
  fieldId: string
  field: FieldResponseV4
  questionNumber?: number
  downloadUrl?: string
}

export const augmentDecryptedResponsesV4 = (
  formFields: FormFieldDto[],
  responsesV4: FieldResponsesV4,
  attachmentMetadata: EncryptedAttachmentRecords,
): AugmentedDecryptedResponseV4[] => {
  // Build ordered field IDs: form fields first, then any remaining (e.g. verified content)
  const formFieldIds = new Set(formFields.map((f) => f._id))
  const remainingFieldIds = Object.keys(responsesV4).filter(
    (id) => !formFieldIds.has(id),
  )
  const orderedFieldIds = [
    ...formFields.map((f) => f._id),
    ...remainingFieldIds,
  ]

  let nonResponseFieldsCount = 0
  const results: AugmentedDecryptedResponseV4[] = []

  orderedFieldIds.forEach((fieldId, index) => {
    const field = responsesV4[fieldId]
    if (!field) return

    if (!isBasicField(field.fieldType)) return

    const isNonResponse = NON_RESPONSE_FIELD_SET.has(
      field.fieldType as BasicField,
    )
    if (isNonResponse) {
      nonResponseFieldsCount++
    }

    results.push({
      fieldId,
      field,
      questionNumber: isNonResponse
        ? undefined
        : index + 1 - nonResponseFieldsCount,
      downloadUrl: attachmentMetadata[fieldId],
    })
  })

  return results
}
