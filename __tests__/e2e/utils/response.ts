import { expect } from '@playwright/test'
import { format, parse } from 'date-fns'
import { readFileSync } from 'fs'
import { BasicField, FormResponseMode } from 'shared/types'

import {
  DATE_INPUT_FORMAT,
  DATE_RESPONSE_FORMAT,
  E2eFieldMetadata,
  FormResponseView,
} from '../constants'

import { isMyInfoableFieldType, isVerifiableFieldType } from './field'

// Utility for getting responses for tables
const TABLE_HANDLER = {
  getName: (
    field: E2eFieldMetadata,
    responseView: FormResponseView,
  ): string => {
    if (field.fieldType !== BasicField.Table) return ''
    let tableTitle = `${field.title} (${field.columns
      .map((x) => x.title)
      .join(', ')})`
    if (responseView.mode === FormResponseMode.Email) {
      tableTitle = '[table] ' + tableTitle
    }
    return tableTitle
  },
  getValues: (
    field: E2eFieldMetadata,
    responseView: FormResponseView,
  ): string[] => {
    if (field.fieldType !== BasicField.Table) return []
    switch (responseView.mode) {
      case FormResponseMode.Email:
        return field.val.map((row) => row.join(','))
      case FormResponseMode.Encrypt:
        // storage mode has a space
        if (responseView.csv) return field.val.map((row) => row.join(';'))
        return field.val.flat()
    }
  },
}

/**
 * Gets the title of a field as it is displayed in a response.
 * @param {E2eFieldMetadata} field field used to create and fill form
 * @param {FormResponseView} formMode form response mode
 * @returns {string} the field title displayed in the response.
 */
export const getResponseTitle = (
  field: E2eFieldMetadata,
  responseView: FormResponseView,
): string => {
  const isCsv =
    responseView.mode === FormResponseMode.Encrypt && responseView.csv
  // MyInfo fields
  if (isMyInfoableFieldType(field) && field.myInfo) {
    if (field.myInfo.verified) return `[MyInfo] ${field.title}`
    return field.title
  }

  // Basic fields
  if (field.fieldType === BasicField.Table) {
    // Delegate the work to the table handler
    return TABLE_HANDLER.getName(field, responseView)
  }
  if (field.fieldType === BasicField.Attachment) {
    switch (responseView.mode) {
      case FormResponseMode.Email:
        return `[attachment] ${field.title}`
      case FormResponseMode.Encrypt:
        return field.title
    }
  }
  if (isVerifiableFieldType(field)) {
    if (!isCsv && field.isVerifiable && field.val)
      return `[verified] ${field.title}`
  }
  return field.title
}

/**
 * Gets answers for a field as displayed in response email or decrypted submission.
 * Always returns an array, so caller must always loop through result.
 * @param {E2eFieldMetadata} field field used to create and fill form
 * @param {FormResponseView} formMode form response mode
 * @returns {string[] | null} string array of responses, or null if the field is a non-response field and should not be represented
 */
export const getResponseArray = (
  field: E2eFieldMetadata,
  responseView: FormResponseView,
): string[] | null => {
  const isCsv =
    responseView.mode === FormResponseMode.Encrypt && responseView.csv

  // Deal with table first to avoid special cases later
  if (field.fieldType === BasicField.Table) {
    return TABLE_HANDLER.getValues(field, responseView)
  }

  switch (field.fieldType) {
    case BasicField.Section:
      return isCsv ? null : ['']
    case BasicField.Image:
    case BasicField.Statement:
      return null
    case BasicField.Radio:
    case BasicField.Checkbox:
      if (!field.val || (field.val instanceof Array && !field.val.length)) {
        return ['']
      }
      return [
        (field.val instanceof Array ? field.val : [field.val])
          .map((selected) => {
            return field.fieldOptions.includes(selected)
              ? selected
              : `Others: ${selected}`
          })
          .join(isCsv ? ';' : ', '),
      ]
    case BasicField.Date:
      // Need to re-parse, because input is in dd/mm/yyyy format whereas response is in dd MMM yyyy format.
      return [
        field.val
          ? format(
              parse(field.val, DATE_INPUT_FORMAT, new Date()),
              DATE_RESPONSE_FORMAT,
            )
          : '',
      ]
    case BasicField.HomeNo:
      return [field.val && `+65${field.val}`]
    default:
      return [field.val]
  }
}

/**
 * Tests that container contains all the values in contained.
 * @param {string} container string in which to search
 * @param {string[]} containedArray Array of values to search for
 */
export const expectContains =
  (container: string) => (containedArray: string[]) => {
    for (const contained of containedArray) {
      expect(container).toContain(contained)
    }
  }

/**
 * Checks that an attachment field's attachment is contained in the email.
 * @param {E2eFieldMetadata} field field used to create and fill form
 * @param {Record<string, string>} attachments map of attachment names to content
 */
export const expectAttachment = (
  field: E2eFieldMetadata,
  attachments: Record<string, string>,
): void => {
  if (field.fieldType !== BasicField.Attachment) return

  // Attachments will not exist if it is unfilled.
  if (!field.val) return

  const content = attachments[field.val]

  // Check that contents match
  expect(content).toEqual(readFileSync(field.path).toString())
}
