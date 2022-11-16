import { expect, Locator, Page } from '@playwright/test'
import { parsePhoneNumber } from 'libphonenumber-js'
import { BasicField } from 'shared/types'

import { IFormSchema } from 'src/types'

import { E2eFieldMetadata, NON_INPUT_FIELD_TYPES } from '../constants/field'
import { PUBLIC_FORM_PAGE_PREFIX } from '../constants/links'

import { extractOtp } from './mail'

/**
 * Navigates to the public form page and ensures that the title of the form is correct.
 * @param {Page} page Playwright page
 * @param {string} formId the created formId
 * @param {string} title the form title
 */
export const accessForm = async (
  page: Page,
  { formId, title }: { formId: string; title: string },
): Promise<void> => {
  await page.goto(`${PUBLIC_FORM_PAGE_PREFIX}/${formId}`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

/**
 * Given a page that can accept field input, fills the form given expected input.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields to be filled
 */
export const fillFields = async (
  page: Page,
  { form, fieldMetas }: SubmitFormProps,
): Promise<void> => {
  // Check that the submit button is visible.
  await expect(
    page.locator(
      'button:text-matches("(submit now)|(submission disabled)", "gi")',
    ),
  ).toBeVisible()

  // Inject field ids into the metadata in order to ensure they are locatable.
  const fieldMetasWithIds = fieldMetas.map((ff, i) => {
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
  let input: Locator
  for (const field of fieldMetasWithIds) {
    // Ignore fields that are non-input.
    if (NON_INPUT_FIELD_TYPES.includes(field.fieldType)) continue

    input = page.locator(`id=${field._id}`)

    switch (field.fieldType) {
      case BasicField.ShortText:
      case BasicField.LongText:
      case BasicField.Nric:
      case BasicField.Uen:
      case BasicField.Number:
      case BasicField.Decimal:
      case BasicField.HomeNo:
      case BasicField.Date: {
        await input.fill(field.val)
        break
      }
      case BasicField.Checkbox:
      case BasicField.Radio: {
        const vals = typeof field.val === 'string' ? [field.val] : field.val
        const options = page.locator('label', {
          has: page.locator(`[name="${field._id}.value"]`),
        })
        const optionLabels = await options.allInnerTexts()
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
        await input.fill(field.val)
        await page.getByRole('option', { name: field.val }).click()
        break
      }
      case BasicField.YesNo: {
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
        await page.locator(`id=${field._id}-${field.val}`).locator('..').click()
        break
      }
      case BasicField.Email: {
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
        await input.setInputFiles(field.path)
        break
      }
      case BasicField.Table: {
        for (let i = 0; i < field.val.length; i++) {
          for (let j = 0; j < field.columns.length; j++) {
            // A little bit gross, but needed to get the column id.
            const formfield = form.form_fields?.find(
              (ff) => ff._id === field._id,
            )
            if (formfield?.fieldType !== BasicField.Table) {
              throw Error('Unexpected field type from form definition')
            }
            const column = formfield.columns[j]
            const val = field.val[i][j]
            input = page.locator(`id=${field._id}.${i}.${column._id}`)
            switch (column.columnType) {
              case BasicField.ShortText: {
                await input.fill(val)
                break
              }
              case BasicField.Dropdown: {
                await input.fill(val)
                await page.getByRole('option', { name: val }).click()
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
 * @param {Page} page Playwright page
 * @returns {string} the responseId
 */
export const clickSubmitBtn = async (page: Page): Promise<string> => {
  await page.locator('button:has-text("Submit now")').click()

  // Verify end page.
  await expect(
    page.getByText(/thank you for filling out the form./i),
  ).toBeVisible()

  const responseIdLocator = page.getByText(/response id:/i)

  await expect(responseIdLocator).toBeVisible()

  const responseIdLabel = await responseIdLocator.innerText()
  const responseIdMatches = responseIdLabel.match(/[a-f0-9]{24}/)
  if (!responseIdMatches || responseIdMatches.length !== 1) {
    throw Error('Number of response ids found was not 1')
  }

  return responseIdMatches[0]
}

export type SubmitFormProps = {
  form: IFormSchema
  fieldMetas: E2eFieldMetadata[]
}

export const submitForm = async (
  page: Page,
  { form, fieldMetas }: SubmitFormProps,
): Promise<string> => {
  await accessForm(page, { formId: form._id, title: form.title })
  // TODO: if authed, do checks and log in.
  await fillFields(page, { form, fieldMetas })
  const responseId = await clickSubmitBtn(page)
  return responseId
}
