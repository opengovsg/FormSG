import { Locator, Page } from '@playwright/test'
import { BasicField } from 'shared/types'

import { E2eFieldMetadata, NON_INPUT_FIELD_TYPES } from '../constants/field'

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

export const fillDropdown = async (
  page: Page,
  input: Locator,
  value: string,
): Promise<void> => {
  await input.fill(value)
  const menuId = await input.getAttribute('aria-controls')
  const menu = page.locator(`id=${menuId}`)
  // Scroll menu into view to avoid flakiness.
  await menu.scrollIntoViewIfNeeded()
  await menu.getByRole('option', { name: value }).click()
}

export const getTitleWithQuestionNumber = (
  formFields: E2eFieldMetadata[],
  i: number,
): string => {
  const field = formFields[i]
  switch (field.fieldType) {
    case BasicField.Section:
    case BasicField.Image:
    case BasicField.Statement: {
      return field.title
    }
    default: {
      const countNonInput = formFields
        .slice(0, i)
        .filter((f) => NON_INPUT_FIELD_TYPES.includes(f.fieldType)).length
      return `${i + 1 - countNonInput}. ${field.title}`
    }
  }
}
