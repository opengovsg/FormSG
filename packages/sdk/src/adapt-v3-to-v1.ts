import { FormField, FormFieldsV3 } from './types'

/**
 * Metadata map to provide missing information when converting from V3 to V1.
 * Maps field ID to the metadata needed to reconstruct a FormField.
 */
export type FieldMetadataMap = Record<
  string,
  {
    question: string
    isHeader?: boolean
    signature?: string
  }
>

/**
 * Map of table field IDs to their column IDs in order.
 * Used to convert v3 table format (Record<string, string>[]) to v1 (string[][])
 */
export type TableColumnMap = Record<string, string[]>

export type AdaptV3ToV1Options = {
  /**
   * Map of field IDs to metadata (question, isHeader, signature).
   * Required to restore metadata that is lost in V3 format.
   */
  fieldMetadata: FieldMetadataMap
  /**
   * Optional map of table field IDs to their column IDs in order.
   * Required for converting table fields from v3 to v1.
   */
  tableColumns?: TableColumnMap
}

/**
 * Converts V3 keyed object responses back to V1 array responses.
 *
 * V3 format: FormFieldsV3 with { [fieldId]: { fieldType, answer } }
 * V1 format: FormField[] with { _id, question, fieldType, answer/answerArray, ... }
 *
 * Note: V3 loses metadata like question, isHeader, and signature, so these must
 * be provided via the options.fieldMetadata parameter.
 *
 * @param v3Responses - The V3 responses record keyed by field ID
 * @param options - Options containing field metadata map and table column map
 * @returns V1 responses array
 */
export function adaptV3ToV1(
  v3Responses: FormFieldsV3,
  options: AdaptV3ToV1Options
): FormField[] {
  const { fieldMetadata, tableColumns = {} } = options
  const v1Responses: FormField[] = []

  for (const [fieldId, field] of Object.entries(v3Responses)) {
    const metadata = fieldMetadata[fieldId]

    if (!metadata) {
      // Skip fields without metadata or use defaults
      console.warn(`Missing metadata for field ${fieldId}, using defaults`)
      continue
    }

    const { question, isHeader, signature } = metadata
    const { fieldType, answer } = field

    // Handle table fields: convert Record<string, string>[] to string[][]
    if (fieldType === 'table' && Array.isArray(answer)) {
      const columnIds = tableColumns[fieldId]
      if (!columnIds) {
        console.warn(
          `Missing column IDs for table field ${fieldId}, skipping conversion`
        )
        continue
      }

      const v3Answer = answer as Record<string, string>[]
      const answerArray: string[][] = v3Answer.map((row) => {
        return columnIds.map((columnId) => row[columnId] ?? '')
      })

      v1Responses.push({
        _id: fieldId,
        question,
        fieldType,
        ...(isHeader !== undefined && { isHeader }),
        ...(signature !== undefined && { signature }),
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
        question,
        fieldType,
        ...(isHeader !== undefined && { isHeader }),
        ...(signature !== undefined && { signature }),
        answerArray: childAnswer.child,
      })
      continue
    }

    // Determine if answer should be in answer or answerArray field
    const isArrayAnswer = Array.isArray(answer)

    const v1Field: FormField = {
      _id: fieldId,
      question,
      fieldType,
      ...(isHeader !== undefined && { isHeader }),
      ...(signature !== undefined && { signature }),
      ...(isArrayAnswer
        ? { answerArray: answer }
        : { answer: answer as string }),
    }

    v1Responses.push(v1Field)
  }

  return v1Responses
}
