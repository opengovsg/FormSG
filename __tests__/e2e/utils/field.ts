import { BasicField } from 'shared/types'

import { E2eFieldMetadata } from '../constants/field'

/**
 * Returns an optional version of a field.
 * @param {E2eFieldMetadata} field
 * @returns {E2eFieldMetadata} optional field
 */
export const getOptionalVersion = (
  field: E2eFieldMetadata,
): E2eFieldMetadata => {
  switch (field.fieldType) {
    case BasicField.Image:
    case BasicField.Section:
    case BasicField.Statement:
      return field
    case BasicField.Table:
      return {
        ...field,
        columns: field.columns.map((col) => ({ ...col, required: false })),
      }
    default:
      return { ...field, required: false }
  }
}

/**
 * Returns a field with a blank response.
 * @param {E2eFieldMetadata} field
 * @param {E2eFieldMetadata} field with blank value
 */
export const getBlankVersion = (field: E2eFieldMetadata): E2eFieldMetadata => {
  switch (field.fieldType) {
    case BasicField.Image:
    case BasicField.Section:
    case BasicField.Statement:
      return field
    case BasicField.Attachment:
      return { ...field, val: '', path: '' }
    case BasicField.Checkbox:
      return { ...field, val: [] }
    case BasicField.Table:
      return {
        ...field,
        val: new Array(field.minimumRows)
          .fill('')
          .map(() => field.columns.map(() => '')),
      }
    default:
      return { ...field, val: '' }
  }
}
