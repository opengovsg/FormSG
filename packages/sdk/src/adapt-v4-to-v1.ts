import {
  ADDRESS_V1_ANSWER_ORDER,
  CHECKBOX_OTHERS_INPUT_VALUE,
  GENERIC_STRING_FIELD_TYPES,
  OTHERS_PREFIX,
} from './constants-v4'
import { FieldType, FormField } from './types'
import {
  AddressAnswerV4,
  AnswerV4,
  CheckboxAnswerV4,
  FieldResponsesV4,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from './types-v4'

function convertToStringAnswer(answer: AnswerV4): string {
  const { value } = answer as StringAnswerV4
  if (typeof value !== 'string') {
    throw new Error('Expected string answer value')
  }
  return value
}

function convertAnswerToV1(
  fieldType: FieldType,
  answer: AnswerV4
): Pick<FormField, 'answer' | 'answerArray' | 'signature'> {
  if (GENERIC_STRING_FIELD_TYPES.has(fieldType)) {
    return { answer: convertToStringAnswer(answer) }
  }

  switch (fieldType) {
    case 'yes_no':
      return { answer: convertToStringAnswer(answer) }
    case 'radiobutton': {
      const { isOthersInput } = answer as RadioAnswerV4
      const value = convertToStringAnswer(answer)
      return { answer: isOthersInput ? `${OTHERS_PREFIX}${value}` : value }
    }
    case 'checkbox': {
      const { value, othersInput } = answer as CheckboxAnswerV4
      if (!Array.isArray(value)) {
        throw new Error('Expected checkbox answer value to be an array')
      }
      return {
        answerArray: value.map((v) =>
          v === CHECKBOX_OTHERS_INPUT_VALUE && othersInput !== undefined
            ? `${OTHERS_PREFIX}${othersInput}`
            : v
        ),
      }
    }
    case 'signature': {
      const { type, value } = answer as SignatureAnswerV4
      if (!Array.isArray(value)) {
        throw new Error('Expected signature answer value to be an array')
      }
      // The V1 producer renders an unsigned signature as ['', ''].
      if (value.length === 0) {
        return { answerArray: ['', ''] }
      }
      return { answerArray: [type, JSON.stringify(value)] }
    }
    case 'address': {
      const subfields = answer as AddressAnswerV4
      return {
        answerArray: ADDRESS_V1_ANSWER_ORDER.map((key) =>
          convertToStringAnswer(subfields[key])
        ),
      }
    }
    case 'table': {
      const rows = Object.values(answer as TableAnswerV4).sort(
        (a, b) => a.rowNum - b.rowNum
      )
      return {
        answerArray: rows.map((row) => Object.values(row.value).map(String)),
      }
    }
    case 'email':
    case 'mobile': {
      const { signature } = answer as VerifiableAnswerV4
      return {
        answer: convertToStringAnswer(answer),
        ...(signature !== undefined && { signature }),
      }
    }
    default:
      return { answer: convertToStringAnswer(answer) }
  }
}

/**
 * Adapts V4 content's field responses to V1 content's `FormField[]`.
 *
 * Form-definition-free: maps only answered fields, in record insertion order,
 * and synthesizes nothing (no empty entries, no section headers, no
 * reordering). Question text is carried over from the self-describing V4
 * responses. See docs/adr/0001-unified-sdk-decrypt-for-v4.md for the
 * fidelity contract.
 */
export function adaptV4ToV1(v4Responses: FieldResponsesV4): FormField[] {
  const v1Fields: FormField[] = []
  for (const [fieldId, field] of Object.entries(v4Responses)) {
    v1Fields.push({
      _id: fieldId,
      question: field.question,
      fieldType: field.fieldType,
      ...convertAnswerToV1(field.fieldType, field.answer),
    } as FormField)
  }
  return v1Fields
}
