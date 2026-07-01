import {
  ADDRESS_SUBFIELD_KEYS,
  GENERIC_STRING_FIELD_TYPES,
} from './constants-v4'
import { FieldType, FormFieldsV3 } from './types'
import {
  AddressAnswerV4,
  AnswerV4,
  AttachmentAnswerV4,
  CheckboxAnswerV4,
  ChildrenAnswerV4,
  FieldResponsesV4,
  RadioAnswerV4,
  SignatureAnswerV4,
  StringAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
  YesNoAnswerV4,
} from './types-v4'

function convertStringAnswerToV3(answer: StringAnswerV4): string {
  return answer.value
}

function convertYesNoAnswerToV3(answer: YesNoAnswerV4): 'Yes' | 'No' {
  return answer.value
}

function convertVerifiableAnswerToV3(answer: VerifiableAnswerV4): {
  value: string
  signature?: string
} {
  return {
    value: answer.value,
    ...(answer.signature !== undefined && { signature: answer.signature }),
  }
}

function convertRadioAnswerToV3(
  answer: RadioAnswerV4
): { value: string } | { othersInput: string } {
  if (answer.isOthersInput) {
    return { othersInput: answer.value }
  }
  return { value: answer.value }
}

function convertCheckboxAnswerToV3(answer: CheckboxAnswerV4): {
  value: string[]
  othersInput?: string
} {
  return {
    value: answer.value,
    ...(answer.othersInput !== undefined && {
      othersInput: answer.othersInput,
    }),
  }
}

function convertAttachmentAnswerToV3(answer: AttachmentAnswerV4): {
  hasBeenScanned: boolean
  answer: string
  md5Hash?: string
} {
  return {
    answer: answer.value,
    hasBeenScanned: answer.hasBeenScanned,
    ...(answer.md5Hash !== undefined && { md5Hash: answer.md5Hash }),
  }
}

function convertTableAnswerToV3(
  answer: TableAnswerV4
): Record<string, string>[] {
  // Convert { rowId: { rowNum: 0, value: {...} } } to array sorted by rowNum
  const rows = Object.values(answer).sort((a, b) => a.rowNum - b.rowNum)
  return rows.map((row) => {
    const result: Record<string, string> = {}
    for (const [columnId, value] of Object.entries(row.value)) {
      result[columnId] = String(value)
    }
    return result
  })
}

function convertChildrenAnswerToV3(answer: ChildrenAnswerV4): {
  child: string[][]
  childFields: string[]
} {
  const childKeys = Object.keys(answer)
  if (childKeys.length === 0) {
    return { child: [], childFields: [] }
  }

  // Extract childFields from the first child
  const firstChild = answer[childKeys[0]]
  const childFields = Object.keys(firstChild.value)

  // Build child array
  const child: string[][] = []
  for (const childKey of childKeys) {
    const childEntry = answer[childKey]
    const childValues: string[] = []
    for (const attr of childFields) {
      childValues.push(childEntry.value[attr]?.value ?? '')
    }
    child.push(childValues)
  }

  // children-v2 (ADR-0001): the per-child record `type` that adaptV3ToV4 stamps
  // onto ChildEntryV4 is intentionally NOT reconstructed here — the v3 answer
  // shape has no slot for it, and this reverse path is legacy/decrypt-only, so a
  // v4→v3 conversion deliberately drops `type` rather than round-tripping it.
  return { child, childFields }
}

function convertAddressAnswerToV3(answer: AddressAnswerV4): {
  addressSubFields: Record<string, string>
} {
  const addressSubFields: Record<string, string> = {}
  for (const key of ADDRESS_SUBFIELD_KEYS) {
    addressSubFields[key] = answer[key].value
  }
  return { addressSubFields }
}

function convertSignatureAnswerToV3(answer: SignatureAnswerV4): {
  type: 'draw'
  value: [number, number, number][][]
} {
  return {
    type: 'draw',
    value: answer.value,
  }
}

/** Main adaptor */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertAnswerToV3(fieldType: FieldType, answer: AnswerV4): any {
  if (GENERIC_STRING_FIELD_TYPES.has(fieldType)) {
    return convertStringAnswerToV3(answer as StringAnswerV4)
  }

  switch (fieldType) {
    case 'yes_no':
      return convertYesNoAnswerToV3(answer as YesNoAnswerV4)
    case 'email':
    case 'mobile':
      return convertVerifiableAnswerToV3(answer as VerifiableAnswerV4)
    case 'radiobutton':
      return convertRadioAnswerToV3(answer as RadioAnswerV4)
    case 'checkbox':
      return convertCheckboxAnswerToV3(answer as CheckboxAnswerV4)
    case 'attachment':
      return convertAttachmentAnswerToV3(answer as AttachmentAnswerV4)
    case 'table':
      return convertTableAnswerToV3(answer as TableAnswerV4)
    case 'children':
      return convertChildrenAnswerToV3(answer as ChildrenAnswerV4)
    case 'address':
      return convertAddressAnswerToV3(answer as AddressAnswerV4)
    case 'signature':
      return convertSignatureAnswerToV3(answer as SignatureAnswerV4)
    default:
      // Safety fallback: coerce to string for any future field types
      return convertStringAnswerToV3(answer as StringAnswerV4)
  }
}

/**
 * Converts V4 normalized responses back to V3 decrypted response shape.
 *
 * @param v4Responses - The V4 responses record (field ID → { fieldType, answer, provenance })
 * @returns V3 responses record (field ID → { fieldType, answer })
 */
export function adaptV4ToV3(v4Responses: FieldResponsesV4): FormFieldsV3 {
  const v3Responses: FormFieldsV3 = {}

  for (const [fieldId, field] of Object.entries(v4Responses)) {
    v3Responses[fieldId] = {
      fieldType: field.fieldType,
      answer: convertAnswerToV3(field.fieldType, field.answer),
    }
  }

  return v3Responses
}
