import {
  AddressAnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  FieldResponsesV4,
  GENERIC_STRING_FIELD_TYPES as SDK_GENERIC_STRING_FIELD_TYPES,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { BasicField, FormFieldDto } from 'formsg-shared/types'

import { transformInputsToOutputs } from '~features/public-form/utils/inputTransformation'

const OTHERS_PREFIX = 'Others: '

// Extend SDK set with yes_no (treated as generic string in flatten context)
const GENERIC_STRING_FIELD_TYPES = new Set([
  ...SDK_GENERIC_STRING_FIELD_TYPES,
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
 * Flattens V4 responses into FormField[] for consumption by the existing
 * CSV pipeline (CsvRecord, EncryptedResponseCsvGenerator, Response classes).
 * Also handles unanswered fields by inserting empty-string answers, to maintain consistency.
 * The output is ordered to match the form definition order (consistent with
 * the V3 processDecryptedContentV3 path). Fields present in v4Responses but
 * not in formFields are appended at the end (verified fields)
 */
export const flattenV4ToFormFields = ({
  v4Responses,
  formFields,
}: {
  v4Responses: FieldResponsesV4
  formFields: FormFieldDto[]
}): FormField[] => {
  const formFieldIdSet = new Set(formFields.map((ff) => ff._id))

  // Fields in form definition order, including unanswered ones
  const v1Fields: FormField[] = []

  for (const ff of formFields) {
    const field = v4Responses[ff._id]
    if (!field) {
      // Reuse v3 transform to get the correct empty output shape per field type.
      // This returns null for Statement/Image (excluded, matching v3 behavior)
      // and the correct answerArray shape for compound fields like Address, Table, etc.
      const emptyOutput = transformInputsToOutputs(ff)
      if (emptyOutput) {
        v1Fields.push(emptyOutput as unknown as FormField)
      }
      continue
    }
    const { fieldType, question } = field
    const fieldId = ff._id

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
      case BasicField.Email:
      case BasicField.Mobile: {
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

      case BasicField.Radio: {
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

      case BasicField.Checkbox: {
        const answer = field.answer as CheckboxAnswerV4
        const answerArray = answer.value.map((v) =>
          v === CLIENT_CHECKBOX_OTHERS_INPUT_VALUE &&
          answer.othersInput !== undefined
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

      case BasicField.Attachment: {
        const answer = field.answer as AttachmentAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answer: answer.value,
        })
        break
      }

      case BasicField.Table: {
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

      case BasicField.Address: {
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

      case BasicField.Signature: {
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

  // Append any extra entries (e.g. verified SPCP/sgID fields) not in formFields
  for (const [fieldId, fieldResponse] of Object.entries(v4Responses)) {
    if (formFieldIdSet.has(fieldId)) continue
    const { fieldType, question } = fieldResponse
    const answer = fieldResponse.answer as StringAnswerV4
    v1Fields.push({
      _id: fieldId,
      question,
      fieldType,
      answer: answer?.value ?? '',
    })
  }

  return v1Fields
}
