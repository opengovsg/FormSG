import { expect, Page } from '@playwright/test'
import { format, parse } from 'date-fns'
import { readFileSync } from 'fs'
import { BasicField, FormAuthType, FormResponseMode } from 'shared/types'

import { IFormSchema, SgidFieldTitle, SPCPFieldTitle } from 'src/types'

import {
  ADMIN_EMAIL,
  DATE_INPUT_FORMAT,
  DATE_RESPONSE_FORMAT,
  E2eFieldMetadata,
  E2eSettingsOptions,
} from '../constants'
import { getAutoreplyEmail, getSubmission } from '../utils'

const MAIL_FROM = 'donotreply@mail.form.gov.sg'

export type VerifySubmissionProps = {
  form: IFormSchema
  formFields: E2eFieldMetadata[]
  formSettings: E2eSettingsOptions
  responseId: string
}

/**
 * Get the submission email from maildev, and ensure that the contents and attachments
 * match what is submitted.
 * @param {Page} page the Playwright page
 * @param {IFormSchema} form the form from the database
 * @param {E2eFieldMetadata[]} formFields the field metadata used to create and fill the form
 * @param {string} responseId the response id of the submission to be verified
 */
export const verifySubmission = async (
  page: Page,
  verifySubmissionProps: VerifySubmissionProps,
): Promise<void> => {
  const { form, formFields, responseId } = verifySubmissionProps

  // Verify the submission content
  switch (form.responseMode) {
    case FormResponseMode.Email:
      await verifyEmailSubmission(page, verifySubmissionProps)
      break
    case FormResponseMode.Encrypt:
      // TODO: add verifier for Encrypt submissions
      break
  }

  // Verify that post-submission actions were taken

  // Email autoreplies should be sent
  for (const field of formFields) {
    if (field.fieldType !== BasicField.Email) continue
    if (field.val && field.autoReplyOptions.hasAutoReply) {
      const { autoReplySender, autoReplySubject, autoReplyMessage } =
        field.autoReplyOptions

      const email = await getAutoreplyEmail(responseId, field.val)

      // Check content of autoreply emails
      expect(email.subject === autoReplySubject).toBeTruthy()
      expect(email.from[0].name === autoReplySender).toBeTruthy()
      expect(email.html.includes(autoReplyMessage)).toBeTruthy()
    }
  }
}

/**
 * Get the submission email from maildev, and ensure that the contents and attachments
 * match what is submitted.
 * @param {Page} page the Playwright page
 * @param {IFormSchema} form the form from the database
 * @param {E2eFieldMetadata[]} formFields the field metadata used to create and fill the form
 * @param {string} responseId the response id of the submission to be verified
 */
export const verifyEmailSubmission = async (
  page: Page,
  { form, formFields, formSettings, responseId }: VerifySubmissionProps,
): Promise<void> => {
  // Get the submission from the email, via the subject.
  const submission = await getSubmission(form.title, responseId)

  // Verify email metadata
  expect(submission.from).toContain(MAIL_FROM)

  const emails = formSettings.emails ?? []
  emails.unshift(ADMIN_EMAIL)

  for (const email of emails) {
    expect(submission.to).toContain(email)
  }

  // Subject need not be verified, since we got the email via the subject.

  const expectSubmissionContains = expectContains(submission.html)

  // Verify form responses in email
  for (const field of formFields) {
    const responseArray = getResponseArray(field, FormResponseMode.Email)
    if (!responseArray) continue
    expectSubmissionContains([
      getResponseTitle(field, false, FormResponseMode.Email),
      ...responseArray,
    ])
    expectAttachment(field, submission.attachments)
  }

  if (formSettings.authType !== FormAuthType.NIL) {
    // Verify that form auth correctly returned NRIC (SPCP/SGID) and UEN (CP)
    if (!formSettings.nric) throw new Error('No nric provided!')
    switch (formSettings.authType) {
      case FormAuthType.SP:
      case FormAuthType.MyInfo:
        expectSubmissionContains([SPCPFieldTitle.SpNric, formSettings.nric])
        break
      case FormAuthType.CP:
        expectSubmissionContains([SPCPFieldTitle.CpUid, formSettings.nric])
        if (!formSettings.uen) throw new Error('No uen provided!')
        expectSubmissionContains([SPCPFieldTitle.CpUen, formSettings.uen])
        break
      case FormAuthType.SGID:
        expectSubmissionContains([SgidFieldTitle.SgidNric, formSettings.nric])
        break
    }
  }
}

// Utility for getting responses for tables
const TABLE_HANDLER = {
  getName: (field: E2eFieldMetadata, formMode: FormResponseMode): string => {
    if (field.fieldType !== BasicField.Table) return ''
    let tableTitle = `${field.title} (${field.columns
      .map((x) => x.title)
      .join(', ')})`
    if (formMode === FormResponseMode.Email) {
      tableTitle = '[table] ' + tableTitle
    }
    return tableTitle
  },
  getValues: (
    field: E2eFieldMetadata,
    formMode: FormResponseMode,
  ): string[] => {
    if (field.fieldType !== BasicField.Table) return []
    switch (formMode) {
      case FormResponseMode.Email:
        return field.val.map((row) => row.join(','))
      case FormResponseMode.Encrypt:
        // storage mode has a space
        return field.val.map((row) => row.join(', '))
    }
  },
}

/**
 * Gets the title of a field as it is displayed in a response.
 * @param {E2eFieldMetadata} field field used to create and fill form
 * @param {boolean} isInJson Whether the title is within the JSON data for email submissions
 * @param {FormResponseMode} formMode form response mode
 * @returns {string} the field title displayed in the response.
 */
const getResponseTitle = (
  field: E2eFieldMetadata,
  isInJson: boolean,
  formMode: FormResponseMode,
): string => {
  if (field.fieldType === 'table') {
    return TABLE_HANDLER.getName(field, formMode)
  } else if (field.fieldType === 'attachment') {
    let title = field.title
    if (formMode === 'email') {
      title = `[attachment] ${title}`
    }
    return title
  } else {
    if (isInJson) {
      if (field.title.startsWith('[verified] ')) {
        return field.title.substring(11)
      } else if (field.title.startsWith('[MyInfo] ')) {
        return field.title.substring(9)
      }
    }
    return field.title
  }
}

/**
 * Gets answers for a field as displayed in response email or decrypted submission.
 * Always returns an array, so caller must always loop through result.
 * @param {E2eFieldMetadata} field field used to create and fill form
 * @param {FormResponseMode} formMode form response mode
 * @returns {string[] | null} string array of responses, or null if the field is a non-response field and should not be represented
 */
const getResponseArray = (
  field: E2eFieldMetadata,
  formMode: FormResponseMode,
): string[] | null => {
  // Deal with table first to avoid special cases later
  if (field.fieldType === BasicField.Table) {
    return TABLE_HANDLER.getValues(field, formMode)
  }

  switch (field.fieldType) {
    case BasicField.Section: {
      return ['']
    }
    case BasicField.Image:
    case BasicField.Statement: {
      return null
    }
    case BasicField.Radio:
    case BasicField.Checkbox: {
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
          .join(', '),
      ]
    }
    case BasicField.Date: {
      // Need to re-parse, because input is in dd/mm/yyyy format whereas response is in dd MMM yyyy format.
      return [
        field.val
          ? format(
              parse(field.val, DATE_INPUT_FORMAT, new Date()),
              DATE_RESPONSE_FORMAT,
            )
          : '',
      ]
    }
    default: {
      return [field.val]
    }
  }
}

/**
 * Tests that container contains all the values in contained.
 * @param {string} container string in which to search
 * @param {string[]} containedArray Array of values to search for
 */
const expectContains = (container: string) => (containedArray: string[]) => {
  for (const contained of containedArray) {
    expect(container).toContain(contained)
  }
}

/**
 * Checks that an attachment field's attachment is contained in the email.
 * @param {E2eFieldMetadata} field field used to create and fill form
 * @param {Record<string, string>} attachments map of attachment names to content
 */
const expectAttachment = (
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
