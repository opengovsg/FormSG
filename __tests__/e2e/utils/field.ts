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

/**
 * Given a dropdown input field, fills the dropdown by picking the correct option
 * from the popover
 * @param {Page} page the Playwright page
 * @param {Locator} input the Playwright locator pointing to the dropdown input
 * @param {string} value the value to fill in the dropdown
 */
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

/**
 * Given a multiselect dropdown field, fills the dropdown by picking all the
 * correct options from the popover
 * @param {Page} page the Playwright page
 * @param {Locator} input the Playwright locator pointing to the dropdown input
 * @param {string} value the values to fill in the dropdown
 */
export const fillMultiDropdown = async (
  page: Page,
  input: Locator,
  values: string[],
): Promise<void> => {
  for (const value of values) await fillDropdown(page, input, value)
  // Multiselect dropdown, click the input again to close the popover
  await input.click()
}

/**
 * Gets the title with correct input question number prepended, if it is an input field.
 * @param {E2eFieldMetadata[]} formFields the form fields used to create the form
 * @param {number} i the field index into form fields to get the title for
 * @returns {string} the title of the field prepended with the question number
 */
export const getTitleWithQuestionNumber = (
  formFields: E2eFieldMetadata[],
  i: number,
): string => {
  const field = formFields[i]
  switch (field.fieldType) {
    case BasicField.Section:
      return field.title
    case BasicField.Image:
      return field.name
    case BasicField.Statement:
      // Replacement strategy for viewing in single line.
      return field.description?.replace(/\s+/, ' ') ?? ''
    default: {
      const countNonInput = formFields
        .slice(0, i)
        .filter((f) => NON_INPUT_FIELD_TYPES.includes(f.fieldType)).length
      return `${i + 1 - countNonInput}. ${field.title}`
    }
  }
}
