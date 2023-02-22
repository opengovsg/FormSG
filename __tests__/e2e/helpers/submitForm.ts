import { expect, Page } from '@playwright/test'
import { parsePhoneNumber } from 'libphonenumber-js'
import { BasicField, FormAuthType } from 'shared/types'

import { IFormSchema } from 'src/types'

import {
  E2eFieldMetadata,
  E2eSettingsOptions,
  NON_INPUT_FIELD_TYPES,
  PUBLIC_FORM_PAGE_PREFIX,
} from '../constants'
import { extractOtp, fillDropdown } from '../utils'

export type SubmitFormProps = {
  form: IFormSchema
  formFields: E2eFieldMetadata[]
  formSettings: E2eSettingsOptions
}

/**
 * Navigate to the public form page, fill the form fields and submit the form.
 * @param {Page} page Playwright page
 * @param {IFormSchema} form the form returned from the db
 * @param {E2eFieldMetadata[]} formFields the fields used to create the form
 * @param {E2eSettingsOptions} formSettings the settings used to create the form
 * @returns {string} the responseId
 */
export const submitForm = async (
  page: Page,
  { form, formFields, formSettings }: SubmitFormProps,
): Promise<string> => {
  await fillForm(page, { form, formFields, formSettings })
  return await clickSubmitBtn(page)
}

/**
 * Navigate to the public form page and fill the form fields.
 * @param {Page} page Playwright page
 * @param {IFormSchema} form the form returned from the db
 * @param {E2eFieldMetadata[]} formFields the fields used to create the form
 * @param {E2eSettingsOptions} formSettings the settings used to create the form
 * @returns {string} the responseId
 */
export const fillForm = async (
  page: Page,
  { form, formFields, formSettings }: SubmitFormProps,
): Promise<void> => {
  await accessForm(page, { form })
  await authForm(page, { formSettings })
  await fillFields(page, { form, formFields })
}

/**
 * Navigates to the public form page and ensures that the title of the form is correct.
 * @param {Page} page Playwright page
 * @param {IFormSchema} form the created form from the db
 */
const accessForm = async (
  page: Page,
  { form }: { form: IFormSchema },
): Promise<void> => {
  await page.goto(`${PUBLIC_FORM_PAGE_PREFIX}/${form._id}`)
  await expect(page.getByRole('heading', { name: form.title })).toBeVisible()
}

/**
 * Navigates to the public form page and ensures that the title of the form is correct.
 * @param {Page} page Playwright page
 * @param {E2eSettingsOptions} formSettings the settings used to create the form
 */
const authForm = async (
  page: Page,
  { formSettings }: { formSettings: E2eSettingsOptions },
): Promise<void> => {
  if (formSettings.authType === FormAuthType.NIL) return

  // Check that the submit button is not visible.
  await expect(
    page.locator(
      'button:text-matches("(submit now)|(submission disabled)", "gi")',
    ),
  ).toBeHidden()

  await page
    .getByRole('button', {
      name: `Log in with Singpass${
        formSettings.authType === FormAuthType.CP
          ? ' (Corporate)'
          : formSettings.authType === FormAuthType.SGID
          ? ' App-only Login'
          : ''
      }`,
    })
    .click()

  // TODO: Actually login! Can't do yet because no mockpass.
}

/**
 * Given a page that can accept field input, fills the form given expected input.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields to be filled
 */
const fillFields = async (
  page: Page,
  {
    form,
    formFields,
  }: {
    form: IFormSchema
    formFields: E2eFieldMetadata[]
  },
): Promise<void> => {
  // Check that the submit button is visible.
  await expect(
    page.locator(
      'button:text-matches("(submit now)|(submission disabled)", "gi")',
    ),
  ).toBeVisible()

  // Inject field ids into the metadata in order to ensure they are locatable.
  const fieldMetasWithIds = formFields.map((ff, i) => {
    const field = form.form_fields?.[i]
    // Since both are ordered arrays, the order should match!
    if (!field || field.fieldType !== ff.fieldType) {
      throw new Error(
        'Form field definition in db does not match test input fields',
      )
    }
    return {
      _id: field._id,
      ...ff,
    }
  })

  // Fill form fields
  for (let i = 0; i < fieldMetasWithIds.length; i++) {
    const field = fieldMetasWithIds[i]
    // Ignore fields that are non-input.
    if (NON_INPUT_FIELD_TYPES.includes(field.fieldType)) continue

    const titleLocator = page
      .locator('label')
      .getByText(new RegExp(`[0-9]*\\.${field.title}`))

    if (field.hidden) {
      // Expect that the question title can't be seen.
      await expect(titleLocator).toBeHidden()
      continue
    }

    // Expect that the question title can be seen.
    await expect(titleLocator).toBeVisible()

    const input = page.locator(`id=${field._id}`)

    switch (field.fieldType) {
      case BasicField.ShortText:
      case BasicField.LongText:
      case BasicField.Nric:
      case BasicField.Uen:
      case BasicField.Number:
      case BasicField.Decimal:
      case BasicField.HomeNo:
      case BasicField.Date: {
        if (!field.val) break
        await input.fill(field.val)
        break
      }
      case BasicField.Checkbox:
      case BasicField.Radio: {
        if (!field.val || (field.val instanceof Array && !field.val.length)) {
          break
        }
        const vals = field.val instanceof Array ? field.val : [field.val]
        const options = page.locator('label', {
          has: page.locator(`[name="${field._id}.value"]`),
        })
        const optionLabelsRaw = await options.allInnerTexts()
        const optionLabels = optionLabelsRaw.map((v) => v.trim())
        const optionNums = vals.map((val) => optionLabels.indexOf(val))
        for (let i = 0; i < vals.length; i++) {
          if (optionNums[i] === -1) {
            // Click and fill "Others", which is always the last element.
            await options.last().click()
            await page
              .locator(`[name="${field._id}.othersInput"]`)
              .fill(vals[i])
          } else {
            await options.nth(optionNums[i]).click()
          }
        }
        break
      }
      case BasicField.Dropdown: {
        if (!field.val) break
        await fillDropdown(page, input, field.val)
        break
      }
      case BasicField.YesNo: {
        if (!field.val) break
        await page
          .locator(
            `data-testid=${field._id}-${
              field.val.toLowerCase() === 'yes' ? 'right' : 'left'
            }`,
          )
          .click()
        break
      }
      case BasicField.Rating: {
        if (!field.val) break
        await page.locator(`id=${field._id}-${field.val}`).locator('..').click()
        break
      }
      case BasicField.Email: {
        if (!field.val) break
        await input.fill(field.val)
        if (field.isVerifiable) {
          const verifyButtonLocator = page.locator(
            `button[name="${field._id}-verify"]`,
          )
          await verifyButtonLocator.click()
          await expect(page.getByText(/Verify your email/)).toBeVisible()
          const otp = await extractOtp(field.val)
          await page.locator('input[name="otp"]').fill(otp)
          await page
            .getByRole('button', { name: 'Submit OTP for verification' })
            .click()
          await expect(verifyButtonLocator).toHaveText(/verified/i)
          await expect(verifyButtonLocator).toBeDisabled()
        }
        break
      }
      case BasicField.Mobile: {
        if (!field.val) break
        let val: string
        if (field.allowIntlNumbers) {
          const phoneNumber = parsePhoneNumber(field.val)
          // Set the correct flag
          await page
            .locator(`id=${field._id}-country`)
            .selectOption(String(phoneNumber.country))
          val = phoneNumber.nationalNumber
        } else {
          val = field.val
        }
        await input.fill(val)
        break
      }
      case BasicField.Attachment: {
        if (!field.path) break
        await input.setInputFiles(field.path)
        break
      }
      case BasicField.Table: {
        // TODO: Does not currently handle adding more rows! Add functionality if needed.
        // A little bit gross, but needed to get the column id.
        const formfield = form.form_fields?.find((ff) => ff._id === field._id)
        if (formfield?.fieldType !== BasicField.Table) {
          throw Error('Unexpected field type from form definition')
        }
        for (let j = 0; j < field.columns.length; j++) {
          const column = formfield.columns[j]
          for (let i = 0; i < field.val.length; i++) {
            const val = field.val[i][j]
            if (!val) continue
            const cell = page.locator(`id=${field._id}.${i}.${column._id}`)
            switch (column.columnType) {
              case BasicField.ShortText: {
                await cell.fill(val)
                break
              }
              case BasicField.Dropdown: {
                await fillDropdown(page, cell, val)
                break
              }
            }
          }
        }
        break
      }
    }
  }
}

/**
 * Click the submit button, and verify that the end page is shown.
 * Requires current page to be the open form page.
 * @param {Page} page Playwright page
 * @returns {string} the responseId
 */
const clickSubmitBtn = async (page: Page): Promise<string> => {
  await page.locator('button:has-text("Submit now")').click()

  // Verify end page with timeout of 10s.
  await expect(
    page.getByText(/thank you for filling out the form./i),
  ).toBeVisible({ timeout: 10000 })

  const responseIdLocator = page.getByText(/response id:/i)

  await expect(responseIdLocator).toBeVisible()

  const responseIdLabel = await responseIdLocator.innerText()
  const responseIdMatches = responseIdLabel.match(/[a-f0-9]{24}/)
  if (!responseIdMatches || responseIdMatches.length !== 1) {
    throw Error('Number of response ids found was not 1')
  }

  return responseIdMatches[0]
}
