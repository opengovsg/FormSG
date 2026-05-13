import { ADDRESS_SUBFIELD_KEYS, GENERIC_STRING_FIELD_TYPES } from './constants-v4'
import { FieldType, FormFieldsV3 } from './types'
import { generateUUID } from './util/crypto'
import {
  AdaptV3ToV4Options,
  AddressAnswerV4,
  AnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  ChildrenAnswerV4,
  FieldResponsesV4,
  FormFieldMeta,
  RadioAnswerV4,
  ResponseProvenance,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
  YesNoAnswerV4,
} from './types-v4'

const convertStringAnswer = (answer: string): StringAnswerV4 => {
  return { value: answer }
}

const convertYesNoAnswer = (answer: string): YesNoAnswerV4 => {
  if (answer !== 'Yes' && answer !== 'No') {
    throw new Error(`Invalid yes_no answer: ${answer}`)
  }
  return { value: answer as 'Yes' | 'No' }
}

const convertVerifiableAnswer = (answer: {
  value: string
  signature?: string
}): VerifiableAnswerV4 => {
  return {
    value: answer.value,
    ...(answer.signature !== undefined && { signature: answer.signature }),
  }
}

const convertRadioAnswer = (
  answer: { value: string } | { othersInput: string }
): RadioAnswerV4 => {
  if ('othersInput' in answer) {
    return { value: answer.othersInput, isOthersInput: true }
  }
  return { value: answer.value, isOthersInput: false }
}

const convertCheckboxAnswer = (answer: {
  value: string[]
  othersInput?: string
}): CheckboxAnswerV4 => {
  return {
    value: answer.value,
    ...(answer.othersInput !== undefined && {
      othersInput: answer.othersInput,
    }),
  }
}

const convertAttachmentAnswer = (answer: {
  hasBeenScanned: boolean
  answer: string
  md5Hash?: string
}): AttachmentAnswerV4 => {
  return {
    value: answer.answer,
    hasBeenScanned: answer.hasBeenScanned,
    ...(answer.md5Hash !== undefined && { md5Hash: answer.md5Hash }),
  }
}

const convertTableAnswer = (answer: Record<string, string>[]): TableAnswerV4 => {
  const result: TableAnswerV4 = {}
  for (let i = 0; i < answer.length; i++) {
    const rowId = generateUUID()
    result[rowId] = { rowNum: i, value: answer[i] }
  }
  return result
}

const convertChildrenAnswer = (answer: {
  child: string[][]
  childFields: string[]
}): ChildrenAnswerV4 => {
  const result: ChildrenAnswerV4 = {}
  for (let i = 0; i < answer.child.length; i++) {
    const childKey = `child${i}`
    const value: Record<string, { value: string; myInfo?: { attr: string } }> =
      {}
    for (let j = 0; j < answer.childFields.length; j++) {
      const attr = answer.childFields[j]
      value[attr] = {
        value: answer.child[i][j] ?? '',
        myInfo: { attr },
      }
    }
    result[childKey] = { value }
  }
  return result
}

const convertAddressAnswer = (answer: {
  addressSubFields: Record<string, string>
}): AddressAnswerV4 => {
  const subFields = answer.addressSubFields
  const result: Record<string, StringAnswerV4> = {}
  for (const key of ADDRESS_SUBFIELD_KEYS) {
    result[key] = { value: subFields[key] ?? ''}
  }
  return result as AddressAnswerV4
}

const convertSignatureAnswer = (answer: {
  type: string
  value: [number, number, number][][]
}): SignatureAnswerV4 => {
  return {
    value: answer.value,
    type: 'draw',
  }
}

// since v3 answer types when decrypted in sdk are not well-typed, we do best-effort conversion based on field type
const convertAnswer = (fieldType: FieldType, answer: any): AnswerV4 => {
  if (GENERIC_STRING_FIELD_TYPES.has(fieldType)) {
    return convertStringAnswer(answer as string)
  }

  switch (fieldType) {
    case 'yes_no':
      return convertYesNoAnswer(answer)
    case 'email':
    case 'mobile':
      return convertVerifiableAnswer(answer)
    case 'radiobutton':
      return convertRadioAnswer(answer)
    case 'checkbox':
      return convertCheckboxAnswer(answer)
    case 'attachment':
      return convertAttachmentAnswer(answer)
    case 'table':
      return convertTableAnswer(answer)
    case 'children':
      return convertChildrenAnswer(answer)
    case 'address':
      return convertAddressAnswer(answer)
    case 'signature':
      return convertSignatureAnswer(answer)
    default:
      // Safety fallback: coerce to string for any future field types
      return convertStringAnswer(String(answer))
  }
}

/**
 * Converts V3 decrypted responses to V4 normalized shape.
 *
 * @param v3Responses - The V3 responses record (field ID → { fieldType, answer })
 * @param options - Optional provenance metadata to stamp on each response
 * @returns V4 responses record
 */
export function adaptV3ToV4(
  v3Responses: FormFieldsV3,
  options: AdaptV3ToV4Options = {}
): FieldResponsesV4 {
  const provenance: ResponseProvenance = options.provenance ?? {
    submittedAt: new Date().toISOString(),
  }
  const formFields: Record<string, FormFieldMeta> = options.formFields ?? {}

  const v4Responses: FieldResponsesV4 = {}

  for (const [fieldId, field] of Object.entries(v3Responses)) {
    const meta = formFields[fieldId]
    const myInfo = meta?.myInfo
    const question = myInfo
      ? `[Myinfo] ${meta?.question ?? ''}`
      : (meta?.question ?? '')

    v4Responses[fieldId] = {
      fieldType: field.fieldType,
      question,
      answer: convertAnswer(field.fieldType, field.answer),
      provenance,
      ...(myInfo && { myInfo }),
    }
  }

  return v4Responses
}
