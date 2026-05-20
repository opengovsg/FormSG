import {
  AnswerV4,
  FieldResponsesV4,
  FieldResponseV4,
} from '@opengovsg/formsg-sdk'
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
  unanswered?: boolean
}

/**
 * Builds a synthetic FieldResponseV4 from a form field definition.
 * Used for non-response fields (e.g. Section headers) and unanswered optional fields,
 * so they can be rendered with question text but no answer body.
 * Safe to use only when paired with unanswered: true, which bypasses answer rendering.
 */
const buildSyntheticField = (formField: FormFieldDto): FieldResponseV4 => ({
  fieldType: formField.fieldType as FieldResponseV4['fieldType'],
  question: formField.title,
  answer: {} as AnswerV4,
  provenance: {},
})

/**
 * Augments decrypted responses with question no., and download url for attachments.
 * Handles inclusion of unanswered fields + header fields
 * @param formFields Ordered snapshot of form field definitions for the submission
 * @param responsesV4 Decrypted responses in V4 format, keyed by field ID
 * @param attachmentMetadata Map of field ID to attachment download URL
 * @returns Ordered list of augmented responses ready for display
 */
export const augmentDecryptedResponsesV4 = (
  formFields: FormFieldDto[],
  responsesV4: FieldResponsesV4,
  attachmentMetadata: EncryptedAttachmentRecords,
): AugmentedDecryptedResponseV4[] => {
  // Build ordered field IDs: form fields first, then any remaining (e.g. verified content)
  const formFieldMap = new Map(formFields.map((f) => [f._id, f]))
  const remainingFieldIds = Object.keys(responsesV4).filter(
    (id) => !formFieldMap.has(id),
  )
  const orderedFieldIds = [
    ...formFields.map((f) => f._id),
    ...remainingFieldIds,
  ]

  let nonResponseFieldsCount = 0
  const results: AugmentedDecryptedResponseV4[] = []

  orderedFieldIds.forEach((fieldId, index) => {
    const field = responsesV4[fieldId]
    const formField = formFieldMap.get(fieldId)

    const fieldType = field?.fieldType ?? (formField?.fieldType as BasicField)
    if (!fieldType || !formField || !isBasicField(fieldType)) return

    const isNonResponse = NON_RESPONSE_FIELD_SET.has(fieldType)
    if (isNonResponse) {
      nonResponseFieldsCount++
      // Only Section headers are rendered; other non-response fields (e.g. Statement) are skipped
      if (fieldType === BasicField.Section) {
        results.push({
          fieldId,
          field: buildSyntheticField(formField),
          unanswered: true,
        })
      }
      return
    }

    results.push({
      fieldId,
      field: field ?? buildSyntheticField(formField),
      questionNumber: index + 1 - nonResponseFieldsCount,
      downloadUrl: attachmentMetadata[fieldId],
      unanswered: !field,
    })
  })

  return results
}
