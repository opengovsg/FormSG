import { FormField, FormFieldsV3 } from './types'

/**
 * Map of table field IDs to their column IDs in order.
 * Used to convert v1 table answerArray (string[][]) to v3 format (Record<string, string>[])
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
   * Required for converting table fields from v1 to v3.
   */
  tableColumns?: TableColumnMap
  /**
   * Optional map of children field IDs to their attribute names.
   * Required for converting children fields from v1 to v3.
   */
  childrenFields?: ChildrenFieldMap
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
      const columnIds = tableColumns[field._id]
      if (!columnIds) {
        console.warn(
          `Missing column IDs for table field ${field._id}, skipping conversion`
        )
        continue
      }

      const answerArray = field.answerArray as string[][]
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

    // Normalize answer: use answer if present, otherwise use answerArray
    const answer = field.answer ?? field.answerArray

    v3Responses[field._id] = {
      fieldType: field.fieldType,
      answer,
    }
  }

  return v3Responses
}
