import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from '../constants/form'
import { BasicField, FormFieldDto, MyInfoAttribute } from '../types/field'
import { FieldResponse } from '../types/response'

import {
  computeAddressAnswerValue,
  computeAttachmentAnswerValue,
  computeCheckboxAnswerValue,
  computeChildrenAnswerValue,
  computeDateAnswerValue,
  computeRadioAnswerValue,
  computeSectionAnswerValue,
  computeSignatureAnswerValue,
  computeSingleAnswerValue,
  computeTableAnswerValue,
  computeVerifiableAnswerValue,
  computeYesNoAnswerValue,
  throwUnsupportedFieldType,
} from './response-value-rules'
import {
  AddressAnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  FieldResponsesV4Input,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from './v4-answer'

/**
 * A V1 response entry as it appears on the wire, including the keys the server
 * appends after validation and which therefore no zod schema declares.
 */
export type FlattenedV1Response = FieldResponse & {
  isUserVerified?: true
  myInfo?: { attr: MyInfoAttribute }
  isVisible?: true
}

const OTHERS_PREFIX = 'Others: '

const GENERIC_STRING_FIELD_TYPES = new Set<string>([
  'section',
  'statement',
  'image',
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

const pickBase = (field: FormFieldDto) => ({
  _id: field._id,
  fieldType: field.fieldType,
  question: field.title,
})

/**
 * The empty entry for a field the respondent never answered, built by handing
 * `undefined` to the same shared value rules the answered path uses. This is a
 * transcription of the frontend's `transformInputsToOutputs(field)` with no
 * input — `formsg-shared` cannot import the frontend, and the unanswered path
 * is the half of the flatten that is already byte-correct, so it delegates
 * exactly as it did before.
 *
 * Returns `null` for the field types that produce no entry at all.
 */
const buildUnansweredEntry = (
  field: FormFieldDto,
): FlattenedV1Response | null => {
  const base = pickBase(field)
  switch (field.fieldType) {
    case BasicField.Statement:
    case BasicField.Image:
      return null
    case BasicField.Section:
      return { ...base, ...computeSectionAnswerValue() } as FlattenedV1Response
    case BasicField.Email:
    case BasicField.Mobile:
      return {
        ...base,
        ...computeVerifiableAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Date:
      return {
        ...base,
        ...computeDateAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.YesNo:
      return {
        ...base,
        ...computeYesNoAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Attachment:
      return {
        ...base,
        ...computeAttachmentAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Checkbox:
      return {
        ...base,
        ...computeCheckboxAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Radio:
      return {
        ...base,
        ...computeRadioAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Table:
      return {
        ...base,
        ...computeTableAnswerValue({
          title: field.title,
          columns: field.columns,
          minimumRows: field.minimumRows,
          input: undefined,
        }),
      } as FlattenedV1Response
    case BasicField.Address:
      return {
        ...base,
        ...computeAddressAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Signature:
      return {
        ...base,
        ...computeSignatureAnswerValue(undefined),
      } as FlattenedV1Response
    case BasicField.Children:
      return {
        ...base,
        ...computeChildrenAnswerValue({
          numberOfSubFields: field.childrenSubFields?.length,
          input: undefined,
        }),
      } as FlattenedV1Response
    case BasicField.Number:
    case BasicField.Decimal:
    case BasicField.ShortText:
    case BasicField.LongText:
    case BasicField.HomeNo:
    case BasicField.Dropdown:
    case BasicField.CountryRegion:
    case BasicField.Rating:
    case BasicField.Nric:
    case BasicField.Uen:
      return {
        ...base,
        ...computeSingleAnswerValue(undefined),
      } as FlattenedV1Response
    default:
      return throwUnsupportedFieldType(field)
  }
}

/**
 * Flattens V4 responses into V1 entries for consumption by the existing
 * CSV pipeline (CsvRecord, EncryptedResponseCsvGenerator, Response classes).
 * Also handles unanswered fields by inserting empty-string answers, to maintain
 * consistency. The output is ordered to match the form definition order
 * (consistent with the V3 processDecryptedContentV3 path). Fields present in
 * v4Responses but not in formFields are appended at the end (verified fields)
 */
export const flattenV4ToFormFields = ({
  v4Responses,
  formFields,
}: {
  v4Responses: FieldResponsesV4Input
  formFields: FormFieldDto[]
}): FlattenedV1Response[] => {
  const formFieldIdSet = new Set(formFields.map((ff) => ff._id))

  // Fields in form definition order, including unanswered ones
  const v1Fields: FlattenedV1Response[] = []

  for (const ff of formFields) {
    const field = v4Responses[ff._id]
    if (!field) {
      const emptyOutput = buildUnansweredEntry(ff)
      if (emptyOutput) {
        v1Fields.push(emptyOutput)
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
      } as FlattenedV1Response)
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
        } as FlattenedV1Response)
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
        } as FlattenedV1Response)
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
        } as FlattenedV1Response)
        break
      }

      case BasicField.Attachment: {
        const answer = field.answer as AttachmentAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answer: answer.value,
        } as FlattenedV1Response)
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
        } as unknown as FlattenedV1Response)
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
        } as FlattenedV1Response)
        break
      }

      case BasicField.Signature: {
        const answer = field.answer as SignatureAnswerV4
        v1Fields.push({
          _id: fieldId,
          question,
          fieldType,
          answerArray: [answer.type, JSON.stringify(answer.value)],
        } as FlattenedV1Response)
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
        } as FlattenedV1Response)
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
    } as FlattenedV1Response)
  }

  return v1Fields
}
