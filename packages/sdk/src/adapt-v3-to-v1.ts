import { FormField, FormFieldsV3 } from './types'

// Constants for "Others" handling - must match adapt-v1-to-v3.ts
const OTHERS_PREFIX = 'Others: '
const CHECKBOX_OTHERS_VALUE = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

// Address field array order in v1
const ADDRESS_FIELD_ORDER = [
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
  'postalCode',
] as const

/**
 * Map of table field IDs to their column IDs in order.
 * Used to convert v3 table format (Record<string, string>[]) to v1 (string[][])
 */
export type TableColumnMap = Record<string, string[]>

/**
 * Minimal form field shape needed to extract metadata for v3-to-v1 conversion.
 */
export type FormFieldForMetadata = {
  _id: string
  title: string
  columns?: Array<{ _id: string; title: string }>
}

export type AdaptV3ToV1Options = {
  /**
   * Array of form fields to extract metadata from.
   * The function will use field._id for ID and field.title for question.
   * For table fields, include columns array to build proper question with column names.
   */
  formFields: FormFieldForMetadata[]
  /**
   * Optional map of table field IDs to their column IDs in order.
   * This is now deprecated - column information should be provided via formFields.columns.
   */
  tableColumns?: TableColumnMap
}

/**
 * Helper function to convert radio button answers from v3 to v1.
 * In v3, it's stored as { othersInput: "<text>" } or { value: "<selection>" }
 * In v1, "Others: <text>" is stored as a single string.
 */
function convertRadioAnswerToV1(
  answer: { value: string } | { othersInput: string }
): string {
  if ('othersInput' in answer) {
    return `${OTHERS_PREFIX}${answer.othersInput}`
  }
  return answer.value
}

/**
 * Helper function to convert checkbox answers from v3 to v1.
 * In v3, it's { value: [..., "!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!"], othersInput: "text" }
 * In v1, "Others: <text>" is stored as one of the array items.
 */
function convertCheckboxAnswerToV1(answer: {
  value: string[]
  othersInput?: string
}): string[] {
  const result: string[] = []

  for (const item of answer.value) {
    if (item === CHECKBOX_OTHERS_VALUE && answer.othersInput !== undefined) {
      result.push(`${OTHERS_PREFIX}${answer.othersInput}`)
    } else {
      result.push(item)
    }
  }

  return result
}

/**
 * Helper function to convert verifiable field answers (email, mobile) from v3 to v1.
 * In v3, signature is stored in answer.signature.
 * In v1, the signature is stored at field.signature level.
 * Returns { answer, signature } where signature is moved to field level.
 */
function convertVerifiableAnswerToV1(answer: {
  value: string
  signature?: string
}): { answer: string; signature?: string } {
  return {
    answer: answer.value,
    ...(answer.signature !== undefined && { signature: answer.signature }),
  }
}

/**
 * Helper function to convert address field from v3 structured object to v1 array.
 * In v3, it's: { addressSubFields: { postalCode, blockNumber, streetName, buildingName, levelNumber, unitNumber } }
 * In v1, address is stored as: [blockNumber, streetName, buildingName, levelNumber, unitNumber, postalCode]
 */
function convertAddressAnswerToV1(answer: {
  addressSubFields: Record<string, string>
}): string[] {
  const subFields = answer.addressSubFields
  return ADDRESS_FIELD_ORDER.map((fieldName) => subFields[fieldName] ?? '')
}

/**
 * Helper function to convert attachment field from v3 to v1.
 * In v3, it's an object with hasBeenScanned, answer (filename), and optional md5Hash.
 * In v1, attachment is just a filename string.
 */
function convertAttachmentAnswerToV1(answer: {
  hasBeenScanned: boolean
  answer: string
  md5Hash?: string
}): string {
  return answer.answer
}

/**
 * Converts V3 keyed object responses back to V1 array responses.
 *
 * V3 format: FormFieldsV3 with { [fieldId]: { fieldType, answer } }
 * V1 format: FormField[] with { _id, question, fieldType, answer/answerArray, ... }
 *
 * Note: V3 loses metadata like question text, so this must be provided via options.formFields.
 *
 * @param v3Responses - The V3 responses record keyed by field ID
 * @param options - Options containing formFields array and optional tableColumns
 * @returns V1 responses array
 */
export function adaptV3ToV1(
  v3Responses: FormFieldsV3,
  options: AdaptV3ToV1Options
): FormField[] {
  // Build fieldMetadata from formFields, including column info for tables
  const fieldMetadata = options.formFields.reduce(
    (acc, ff) => {
      acc[ff._id] = {
        question: ff.title,
        columns: ff.columns,
      }
      return acc
    },
    {} as Record<
      string,
      { question: string; columns?: Array<{ _id: string; title: string }> }
    >
  )

  const tableColumns = options.tableColumns ?? {}
  const v1Responses: FormField[] = []

  for (const [fieldId, field] of Object.entries(v3Responses)) {
    const metadata = fieldMetadata[fieldId]

    if (!metadata) {
      // Skip fields without metadata or use defaults
      console.warn(`Missing metadata for field ${fieldId}, using defaults`)
      continue
    }

    const { question: baseQuestion, columns } = metadata
    const { fieldType, answer } = field

    // Handle table fields: convert Record<string, string>[] to string[][]
    if (fieldType === 'table' && Array.isArray(answer)) {
      const v3Answer = answer as Record<string, string>[]

      // Get column IDs and titles from metadata (preferred) or fallback to legacy options
      let columnIds: string[] | undefined
      let columnTitles: string[] | undefined

      if (columns && columns.length > 0) {
        columnIds = columns.map((col) => col._id)
        columnTitles = columns.map((col) => col.title)
      } else {
        // Fallback to legacy tableColumns option
        columnIds = tableColumns[fieldId]
        // If still no column IDs, extract from first row
        if (!columnIds && v3Answer.length > 0) {
          columnIds = Object.keys(v3Answer[0])
        }
      }

      if (!columnIds || columnIds.length === 0) {
        console.warn(
          `Cannot determine columns for table field ${fieldId}, skipping conversion`
        )
        continue
      }

      // Build question with column names if available
      const question = columnTitles
        ? `${baseQuestion} (${columnTitles.join(', ')})`
        : baseQuestion

      const answerArray: string[][] = v3Answer.map((row) => {
        return columnIds.map((columnId) => row[columnId] ?? '')
      })

      v1Responses.push({
        _id: fieldId,
        question,
        fieldType,
        answerArray,
      })
      continue
    }

    // Handle children fields: extract child array from { child, childFields }
    if (
      fieldType === 'children' &&
      answer &&
      typeof answer === 'object' &&
      'child' in answer
    ) {
      const childAnswer = answer as { child: string[][]; childFields: string[] }
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        answerArray: childAnswer.child,
      })
      continue
    }

    // Handle radio button fields: convert from v3 format with othersInput
    if (
      fieldType === 'radiobutton' &&
      answer &&
      typeof answer === 'object' &&
      ('value' in answer || 'othersInput' in answer)
    ) {
      const v1Answer = convertRadioAnswerToV1(
        answer as { value: string } | { othersInput: string }
      )
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        answer: v1Answer,
      })
      continue
    }

    // Handle checkbox fields: convert from v3 format with othersInput
    if (
      fieldType === 'checkbox' &&
      answer &&
      typeof answer === 'object' &&
      'value' in answer
    ) {
      const v1Answer = convertCheckboxAnswerToV1(
        answer as { value: string[]; othersInput?: string }
      )
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        answerArray: v1Answer,
      })
      continue
    }

    // Handle email fields: convert from verifiable format
    if (
      fieldType === 'email' &&
      answer &&
      typeof answer === 'object' &&
      'value' in answer
    ) {
      const { answer: v1Answer, signature } = convertVerifiableAnswerToV1(
        answer as { value: string; signature?: string }
      )
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        ...(signature !== undefined && { signature }),
        answer: v1Answer,
      })
      continue
    }

    // Handle mobile fields: convert from verifiable format
    if (
      fieldType === 'mobile' &&
      answer &&
      typeof answer === 'object' &&
      'value' in answer
    ) {
      const { answer: v1Answer, signature } = convertVerifiableAnswerToV1(
        answer as { value: string; signature?: string }
      )
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        ...(signature !== undefined && { signature }),
        answer: v1Answer,
      })
      continue
    }

    // Handle address fields: convert from structured object to array
    if (
      fieldType === 'address' &&
      answer &&
      typeof answer === 'object' &&
      'addressSubFields' in answer
    ) {
      const v1Answer = convertAddressAnswerToV1(
        answer as { addressSubFields: Record<string, string> }
      )
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        answerArray: v1Answer,
      })
      continue
    }

    // Handle attachment fields: extract filename from structured object
    if (
      fieldType === 'attachment' &&
      answer &&
      typeof answer === 'object' &&
      'answer' in answer
    ) {
      const v1Answer = convertAttachmentAnswerToV1(
        answer as { hasBeenScanned: boolean; answer: string; md5Hash?: string }
      )
      v1Responses.push({
        _id: fieldId,
        question: baseQuestion,
        fieldType,
        answer: v1Answer,
      })
      continue
    }

    // Default handling: determine if answer should be in answer or answerArray field
    const isArrayAnswer = Array.isArray(answer)

    const v1Field: FormField = {
      _id: fieldId,
      question: baseQuestion,
      fieldType,
      ...(isArrayAnswer
        ? { answerArray: answer }
        : { answer: answer as string }),
    }

    v1Responses.push(v1Field)
  }

  return v1Responses
}
