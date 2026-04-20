import {
  AddressAnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  FieldResponsesV4,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

const OTHERS_PREFIX = 'Others: '
const CHECKBOX_OTHERS_VALUE = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

const GENERIC_STRING_FIELD_TYPES = new Set([
  'section',
  'number',
  'decimal',
  'textfield',
  'textarea',
  'homeno',
  'dropdown',
  'rating',
  'nric',
  'uen',
  'date',
  'country_region',
  'yes_no',
])

const ADDRESS_FIELD_ORDER = [
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
  'postalCode',
] as const

/**
 * Flattens V4 responses into V1 FormField[] for consumption by the existing
 * CSV pipeline (CsvRecord, EncryptedResponseCsvGenerator, Response classes).
 *
 * This is a direct V4 → V1 conversion that avoids the V4 → V3 → V1 chain,
 * since V4 already carries the question text and typed answers.
 */
export function flattenV4ToFormFields(
  v4Responses: FieldResponsesV4,
): FormField[] {
  const v1Fields: FormField[] = []

  for (const [fieldId, field] of Object.entries(v4Responses)) {
    const { fieldType, question } = field

    // Generic string fields (including yes_no)
    if (GENERIC_STRING_FIELD_TYPES.has(fieldType)) {
      const answer = field.answer as StringAnswerV4
      v1Fields.push({
        _id: fieldId,
        question,
        fieldType,
        answer: answer.value,
      })
      continue
    }

    switch (fieldType) {
      case 'email':
      case 'mobile': {
        const answer = field.answer as VerifiableAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answer: answer.value,
          ...(answer.signature !== undefined && {
            signature: answer.signature,
          }),
        })
        break
      }

      case 'radiobutton': {
        const answer = field.answer as RadioAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answer: answer.isOthersInput
            ? `${OTHERS_PREFIX}${answer.value}`
            : answer.value,
        })
        break
      }

      case 'checkbox': {
        const answer = field.answer as CheckboxAnswerV4
        const answerArray = answer.value.map((v) =>
          v === CHECKBOX_OTHERS_VALUE && answer.othersInput !== undefined
            ? `${OTHERS_PREFIX}${answer.othersInput}`
            : v,
        )
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answerArray,
        })
        break
      }

      case 'attachment': {
        const answer = field.answer as AttachmentAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answer: answer.value,
        })
        break
      }

      case 'table': {
        const answer = field.answer as TableAnswerV4
        const rows = Object.values(answer).sort((a, b) => a.rowNum - b.rowNum)
        const answerArray: string[][] = rows.map((row) =>
          Object.values(row.value).map(String),
        )
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answerArray,
        })
        break
      }

      case 'address': {
        const answer = field.answer as AddressAnswerV4
        const answerArray = ADDRESS_FIELD_ORDER.map((key) => answer[key].value)
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answerArray,
        })
        break
      }

      case 'signature': {
        const answer = field.answer as SignatureAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answerArray: [JSON.stringify(answer.value)],
        })
        break
      }

      default: {
        // Passthrough for unknown field types
        const answer = field.answer as StringAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answer: answer?.value ?? '',
        })
        break
      }
    }
  }

  return v1Fields
}
