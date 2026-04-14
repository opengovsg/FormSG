import * as crypto from 'crypto'

import { FormField, FormFieldsV3 } from './types'

/**
 * Generate a random UUID v4
 * Fallback implementation for environments where crypto.randomUUID is not available
 */
function generateUUID(): string {
  // Try using crypto.randomUUID if available (Node 14.17+/16+)
  if (crypto.randomUUID && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // Fallback: Generate UUID v4 manually using crypto.randomBytes
  const bytes = crypto.randomBytes(16)

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Format as UUID string
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Map of table field IDs to their column IDs in order.
 * Used to convert v1 table answerArray (string[][]) to v3 format (Record<string, string>[])
 * This is optional - if not provided, random UUIDs will be generated.
 */
export type TableColumnMap = Record<string, string[]>

/**
 * Map of children field IDs to their child attribute names in order.
 * Used to convert v1 children answerArray (string[][]) to v3 format
 */
export type ChildrenFieldMap = Record<string, string[]>

export type AdaptV1ToV3Options = {
  /**
   * Optional map of table field IDs to their column IDs.
   * If not provided, random UUIDs will be generated for each column.
   */
  tableColumns?: TableColumnMap
  /**
   * Optional map of children field IDs to their attribute names.
   * Required for converting children fields from v1 to v3.
   */
  childrenFields?: ChildrenFieldMap
}

// Constants for "Others" handling
const OTHERS_PREFIX = 'Others: '
const CHECKBOX_OTHERS_VALUE = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

// Address field array order in v1: [blockNumber, streetName, buildingName, levelNumber, unitNumber, postalCode]
const ADDRESS_FIELD_ORDER = [
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
  'postalCode',
] as const

/**
 * Helper function to convert radio button answers from v1 to v3.
 * In v1, "Others: <text>" is stored as a single string.
 * In v3, it's stored as { othersInput: "<text>" } or { value: "<selection>" }
 */
function convertRadioAnswer(
  answer: string
): { value: string } | { othersInput: string } {
  if (answer.startsWith(OTHERS_PREFIX)) {
    const othersInput = answer.substring(OTHERS_PREFIX.length)
    return { othersInput }
  }
  return { value: answer }
}

/**
 * Helper function to convert checkbox answers from v1 to v3.
 * In v1, "Others: <text>" is stored as one of the array items.
 * In v3, it's replaced with a constant and stored separately in othersInput.
 */
function convertCheckboxAnswer(answerArray: string[]): {
  value: string[]
  othersInput?: string
} {
  const value: string[] = []
  let othersInput: string | undefined

  for (const item of answerArray) {
    if (item.startsWith(OTHERS_PREFIX)) {
      // Extract the "others" text and replace with constant
      othersInput = item.substring(OTHERS_PREFIX.length)
      value.push(CHECKBOX_OTHERS_VALUE)
    } else {
      value.push(item)
    }
  }

  return othersInput !== undefined ? { value, othersInput } : { value }
}

/**
 * Helper function to convert verifiable field answers (email, mobile) from v1 to v3.
 * In v1, the signature is stored in field.signature.
 * In v3, it's stored in answer.signature.
 */
function convertVerifiableAnswer(
  answer: string,
  signature?: string
): {
  value: string
  signature?: string
} {
  if (signature) {
    return { value: answer, signature }
  }
  return { value: answer }
}

/**
 * Helper function to convert address field from v1 array to v3 structured object.
 * In v1, address is stored as: [blockNumber, streetName, buildingName, levelNumber, unitNumber, postalCode]
 * In v3, it's stored as: { addressSubFields: { postalCode, blockNumber, streetName, buildingName, levelNumber, unitNumber } }
 */
function convertAddressAnswer(answerArray: string[]): {
  addressSubFields: {
    postalCode: string
    blockNumber: string
    streetName: string
    buildingName: string
    levelNumber: string
    unitNumber: string
  }
} {
  const addressSubFields: Record<string, string> = {}
  ADDRESS_FIELD_ORDER.forEach((fieldName, index) => {
    addressSubFields[fieldName] = answerArray[index] ?? ''
  })

  return {
    addressSubFields: {
      postalCode: addressSubFields.postalCode,
      blockNumber: addressSubFields.blockNumber,
      streetName: addressSubFields.streetName,
      buildingName: addressSubFields.buildingName,
      levelNumber: addressSubFields.levelNumber,
      unitNumber: addressSubFields.unitNumber,
    },
  }
}

/**
 * Helper function to convert attachment field from v1 to v3.
 * In v1, attachment is just a filename string.
 * In v3, it's an object with hasBeenScanned, answer (filename), and optional md5Hash.
 */
function convertAttachmentAnswer(answer: string): {
  hasBeenScanned: boolean
  answer: string
  md5Hash?: string
} {
  return {
    hasBeenScanned: true, // v1 data doesn't have scan information, so true by default
    answer,
  }
}

/**
 * Converts V1 array responses to V3 keyed object responses.
 *
 * V1 format: FormField[] with { _id, question, fieldType, answer/answerArray, ... }
 * V3 format: FormFieldsV3 with { [fieldId]: { fieldType, answer } }
 *
 * @param v1Responses - The V1 responses array
 * @param options - Optional metadata for table and children field conversions
 * @returns V3 responses record keyed by field ID
 */
export function adaptV1ToV3(
  v1Responses: FormField[],
  options: AdaptV1ToV3Options = {}
): FormFieldsV3 {
  const { tableColumns = {}, childrenFields = {} } = options
  const v3Responses: FormFieldsV3 = {}

  for (const field of v1Responses) {
    // Skip header fields that have no answer
    if (field.isHeader) {
      continue
    }

    // Handle table fields: convert string[][] to Record<string, string>[]
    if (field.fieldType === 'table' && field.answerArray) {
      const answerArray = field.answerArray as string[][]

      // Get column IDs from options or generate random UUIDs
      let columnIds = tableColumns[field._id]
      if (!columnIds && answerArray.length > 0) {
        // Generate random UUIDs for each column based on the first row, since we don't have 1-1 mapping of columnIds
        // This is best effort and may not perfectly preserve column identity, but it's necessary without explicit metadata
        // columnID is not used in v3 format, so this is just to satisfy the structure of Record<string, string>
        const numColumns = answerArray[0]?.length ?? 0
        columnIds = Array.from({ length: numColumns }, () => generateUUID())
      }

      if (!columnIds || columnIds.length === 0) {
        console.warn(
          `Cannot determine columns for table field ${field._id}, skipping conversion`
        )
        continue
      }

      const v3Answer: Record<string, string>[] = answerArray.map((row) => {
        const rowObj: Record<string, string> = {}
        columnIds.forEach((columnId, index) => {
          rowObj[columnId] = row[index] ?? ''
        })
        return rowObj
      })

      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: v3Answer,
      }
      continue
    }

    // Handle children fields: convert string[][] to { child: string[][], childFields: string[] }
    if (field.fieldType === 'children' && field.answerArray) {
      const childFields = childrenFields[field._id]
      if (!childFields) {
        console.warn(
          `Missing child fields for children field ${field._id}, skipping conversion`
        )
        continue
      }

      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: {
          child: field.answerArray as string[][],
          childFields,
        },
      }
      continue
    }

    // Handle radio button fields: convert "Others: <text>" format
    if (field.fieldType === 'radiobutton' && field.answer) {
      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: convertRadioAnswer(field.answer),
      }
      continue
    }

    // Handle checkbox fields: convert "Others: <text>" format in answerArray
    if (field.fieldType === 'checkbox' && field.answerArray) {
      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: convertCheckboxAnswer(field.answerArray as string[]),
      }
      continue
    }

    // Handle email fields: convert to verifiable format with signature
    if (field.fieldType === 'email' && field.answer) {
      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: convertVerifiableAnswer(field.answer, field.signature),
      }
      continue
    }

    // Handle mobile fields: convert to verifiable format with signature
    if (field.fieldType === 'mobile' && field.answer) {
      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: convertVerifiableAnswer(field.answer, field.signature),
      }
      continue
    }

    // Handle address fields: convert array to structured object
    if (field.fieldType === 'address' && field.answerArray) {
      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: convertAddressAnswer(field.answerArray as string[]),
      }
      continue
    }

    // Handle attachment fields: convert to structured object with hasBeenScanned
    if (field.fieldType === 'attachment' && field.answer) {
      v3Responses[field._id] = {
        fieldType: field.fieldType,
        answer: convertAttachmentAnswer(field.answer),
      }
      continue
    }

    // Normalize answer: use answer if present, otherwise use answerArray
    const answer = field.answer ?? field.answerArray

    v3Responses[field._id] = {
      fieldType: field.fieldType,
      answer,
    }
  }

  return v3Responses
}
