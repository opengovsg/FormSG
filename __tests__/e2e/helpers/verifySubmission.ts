import { expect, Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { BasicField, FormAuthType, FormResponseMode } from 'shared/types'

import { IFormSchema, SgidFieldTitle, SPCPFieldTitle } from 'src/types'

import {
  ADMIN_EMAIL,
  ADMIN_FORM_PAGE_RESPONSES,
  ADMIN_FORM_PAGE_RESPONSES_INDIVIDUAL,
  E2eFieldMetadata,
  E2eFormResponseMode,
  E2eSettingsOptions,
} from '../constants'
import {
  expectAttachment,
  expectContains,
  expectToast,
  getAutoreplyEmail,
  getResponseArray,
  getResponseTitle,
  getSubmission,
} from '../utils'

const MAIL_FROM = 'donotreply@mail.form.gov.sg'

export type VerifySubmissionBaseInputs = {
  form: IFormSchema
  responseId: string
  formFields: E2eFieldMetadata[]
  formSettings: E2eSettingsOptions
}

/**
 * Get the submission email from maildev, and ensure that the contents and attachments
 * match what is submitted.
 * @param {Page} page the Playwright page
 * @param {IFormSchema} form the form from the database
 * @param {E2eFormResponseMode} formResponseMode the response mode of the form, including the secret key if the form is in encrypt mode
 * @param {string} responseId the response id of the submission to be verified
 * @param {E2eFieldMetadata[]} formFields the field metadata used to create and fill the form
 * @param {E2eSettingsOptions} formSettings the form settings used to create the form
 */
export const verifySubmission = async (
  page: Page,
  data: VerifySubmissionBaseInputs & { formResponseMode: E2eFormResponseMode },
): Promise<void> => {
  const { formResponseMode, responseId, formFields } = data

  // Verify the submission content
  switch (formResponseMode.responseMode) {
    case FormResponseMode.Email:
      await verifyEmailSubmission(data)
      break
    case FormResponseMode.Encrypt:
      await verifyEncryptSubmission(page, {
        ...data,
        ...formResponseMode,
      })
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
 * @param {IFormSchema} form the form from the database
 * @param {string} responseId the response id of the submission to be verified
 * @param {E2eFieldMetadata[]} formFields the field metadata used to create and fill the form
 * @param {E2eSettingsOptions} formSettings the form settings used to create the form
 */
export const verifyEmailSubmission = async ({
  form,
  responseId,
  formFields,
  formSettings,
}: VerifySubmissionBaseInputs): Promise<void> => {
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
    const responseArray = getResponseArray(field, {
      mode: FormResponseMode.Email,
    })
    if (!responseArray) continue
    expectSubmissionContains([
      getResponseTitle(field, { mode: FormResponseMode.Email }),
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

/**
 * Read the submission from the individual response page, and ensure that the
 * contents and attachments match what is submitted.
 * @param {Page} page the Playwright page
 * @param {IFormSchema} form the form from the database
 * @param {string} secretKey the secret key for the encrypt form
 * @param {string} responseId the response id of the submission to be verified
 * @param {E2eFieldMetadata[]} formFields the field metadata used to create and fill the form
 * @param {E2eSettingsOptions} formSettings the form settings used to create the form
 */
export const verifyEncryptSubmission = async (
  page: Page,
  {
    form,
    secretKey,
    responseId,
    formFields,
  }: VerifySubmissionBaseInputs & { secretKey: string },
): Promise<void> => {
  // Go to the responses summary page and enter the secret key
  await page.goto(ADMIN_FORM_PAGE_RESPONSES(form._id))
  await page.getByLabel(/Enter or upload Secret Key/).fill(secretKey)
  await page.getByRole('button', { name: 'Unlock responses' }).click()

  // Try downloading CSV and checking contents
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  await page.getByRole('menuitem', { name: 'CSV only' }).click()
  const download = await downloadPromise
  const path = await download.path()
  if (!path) throw new Error('CSV download failed')

  await expectToast(page, /Success\. 1\/1 response was decrypted\./)

  const content = readFileSync(path).toString()
  const expectSubmissionContains = expectContains(content)

  expectSubmissionContains([responseId])
  for (const field of formFields) {
    const responseArray = getResponseArray(field, {
      mode: FormResponseMode.Encrypt,
      csv: true,
    })
    if (!responseArray) continue
    expectSubmissionContains([field.title, ...responseArray])
  }

  // TODO: Attachments don't work in storage mode tests, so no need to download CSV with attachments.

  // Ensure there is a cell with the response ID and click into it
  await page.getByRole('cell', { name: responseId }).click()

  // We should be at the individual response page now.
  await expect(page).toHaveURL(
    ADMIN_FORM_PAGE_RESPONSES_INDIVIDUAL(form._id, responseId),
  )

  // Expect all the content of the page
  for (const field of formFields) {
    const responseArray = getResponseArray(field, {
      mode: FormResponseMode.Encrypt,
      csv: false,
    })
    if (!responseArray) continue
    const responseTitle = getResponseTitle(field, {
      mode: FormResponseMode.Encrypt,
      csv: false,
    })
    await expect(page.getByText(responseTitle)).toBeVisible()
    for (const response of responseArray) {
      if (response) {
        await expect(page.getByText(response, { exact: true })).toBeVisible()
      }
    }
  }
}
