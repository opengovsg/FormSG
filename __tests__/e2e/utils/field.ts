import { expect, Page } from '@playwright/test'
import { format } from 'date-fns'
import { BASICFIELD_TO_DRAWER_META } from 'frontend/src/features/admin-form/create/constants'
import { BasicField, DateSelectedValidation } from 'shared/types'

import { E2eFieldMetadata } from '../constants/field'
import { ADMIN_FORM_PAGE_PREFIX } from '../constants/links'

const NON_INPUT_FIELD_TYPES = [
  BasicField.Section,
  BasicField.Image,
  BasicField.Statement,
]

export const createField = async (
  page: Page,
  field: E2eFieldMetadata,
): Promise<void> => {
  const label = BASICFIELD_TO_DRAWER_META[field.fieldType].label
  const isNonInput = NON_INPUT_FIELD_TYPES.includes(field.fieldType)

  await page.getByRole('button', { name: label }).click()

  // Enter title for input fields and Section
  if (isNonInput) {
    if (field.fieldType === BasicField.Section) {
      await page.getByLabel('Section heading').fill(field.title)
    }
    // Images and Statements don't have titles
  } else {
    await page.getByLabel('Question').fill(field.title)
  }

  // Toggle required for input fields except Table field (required toggled for individual columns)
  if (
    !isNonInput &&
    field.fieldType !== BasicField.Table &&
    field.required === false
  ) {
    await page.getByText('Required').click()
  }

  // Enter field description.
  if (field.description) {
    if (field.fieldType === BasicField.Statement) {
      await page.getByLabel('Paragraph').fill(field.description)
    } else {
      await page.getByLabel('Description').fill(field.description)
    }
  }

  // Handle the rest of the individual fields.
  switch (field.fieldType) {
    case BasicField.Attachment:
      await page.getByLabel('Maximum size of individual attachment').click()
      await page
        .getByRole('option', { name: `${field.attachmentSize} MB` })
        .click()
      break
    case BasicField.Checkbox:
      if (field.validateByValue) {
        await page.getByLabel('Selection limits').click()
        if (field.ValidationOptions.customMin) {
          await page
            .getByPlaceholder('Minimum')
            .nth(1)
            .fill(field.ValidationOptions.customMin.toString())
        }
        if (field.ValidationOptions.customMax) {
          await page
            .getByPlaceholder('Maximimum')
            .nth(1)
            .fill(field.ValidationOptions.customMax.toString())
        }
      }
    // Fall through to set "Others" and "Options".
    case BasicField.Radio:
      if (field.othersRadioButton) {
        await page.getByText('Others').first().click()
      }
    // Fall through to set "Options".
    case BasicField.Dropdown:
      await page.getByLabel('Options').fill(field.fieldOptions.join('\n'))
      break
    case BasicField.Date:
      {
        if (!field.dateValidation.selectedDateValidation) break
        await page.getByRole('combobox').first().click()
        await page
          .getByText(field.dateValidation.selectedDateValidation)
          .click()
        if (
          field.dateValidation.selectedDateValidation ===
          DateSelectedValidation.Custom
        ) {
          if (field.dateValidation.customMinDate) {
            await page
              .locator('[name="dateValidation.customMinDate"]')
              .fill(format(field.dateValidation.customMinDate, 'dd/MM/yyyy'))
          }
          if (field.dateValidation.customMaxDate) {
            await page
              .locator('[name="dateValidation.customMaxDate"]')
              .fill(format(field.dateValidation.customMaxDate, 'dd/MM/yyyy'))
          }
        }
      }
      break
    case BasicField.Decimal:
      if (field.validateByValue) {
        await page.getByText('Number validation').click()
        if (field.ValidationOptions.customMin) {
          await page
            .getByPlaceholder('Minimum value')
            .nth(1)
            .fill(field.ValidationOptions.customMin.toString())
        }
        if (field.ValidationOptions.customMax) {
          await page
            .getByPlaceholder('Maximum value')
            .nth(1)
            .fill(field.ValidationOptions.customMax.toString())
        }
      }
      break
    case BasicField.Email:
      if (field.isVerifiable) {
        await page.locator('label:has-text("OTP verification")').click()
        if (field.hasAllowedEmailDomains) {
          await page.getByText('Restrict email domains').click()
          await page
            .getByLabel('Domains allowed')
            .fill(field.allowedEmailDomains.join('\n'))
        }
      }
      if (field.autoReplyOptions.hasAutoReply) {
        await page.getByText('Email confirmation').click()
        await page
          .getByLabel('Subject')
          .fill(field.autoReplyOptions.autoReplySubject)
        await page
          .getByLabel('Sender name')
          .fill(field.autoReplyOptions.autoReplySender)
        await page
          .getByLabel('Content')
          .fill(field.autoReplyOptions.autoReplyMessage)
        if (field.autoReplyOptions.includeFormSummary) {
          await page.getByText('Include PDF response').click()
        }
      }
      break
    case BasicField.Image:
      await page.setInputFiles('input[type="file"]', field.path)
      break
    case BasicField.LongText:
    case BasicField.Number:
    case BasicField.ShortText:
      if (field.ValidationOptions.selectedValidation) {
        // Select from dropdown
        await page
          .locator(`[id="ValidationOptions.selectedValidation"]`)
          .fill(field.ValidationOptions.selectedValidation)
        await page
          .getByRole('option', {
            name: field.ValidationOptions.selectedValidation,
          })
          .click()
        if (field.ValidationOptions.customVal) {
          await page
            .getByPlaceholder('Number of characters')
            .nth(1)
            .fill(field.ValidationOptions.customVal.toString())
        }
      }
      break
    case BasicField.Mobile:
      if (field.allowIntlNumbers) {
        await page.getByText('Allow international numbers').click()
      }
      if (field.isVerifiable) {
        await page.getByText('OTP verification').first().click()
        await page.getByRole('button', { name: 'Yes, I understand' }).click()
      }
      break
    case BasicField.Rating:
      await page.getByLabel('Number of steps').click()
      await page
        .getByRole('option', { name: String(field.ratingOptions.steps) })
        .click()
      await page.getByLabel('Shape').click()
      await page
        .getByRole('option', { name: field.ratingOptions.shape })
        .click()
      break
    case BasicField.Table:
      await page.getByLabel('Minimum rows').fill(String(field.minimumRows))
      if (field.addMoreRows) {
        await page.getByText('Allow respondent to add more rows').click()
        if (field.maximumRows) {
          await page
            .getByLabel('Maximum rows allowed')
            .fill(String(field.maximumRows))
        }
      }
      // First table option
      for (let index = 0; index < field.columns.length; index++) {
        const col = field.columns[index]
        if (index !== 0) {
          await page.getByRole('button', { name: 'Add column' }).click()
        }
        await page.getByLabel(`Column ${index + 1}`).fill(col.title)
        await page.getByLabel('Column type').nth(index).click()
        await page
          .getByRole('option', {
            name: BASICFIELD_TO_DRAWER_META[col.columnType].label,
          })
          .click()
        if (!col.required) {
          await page.getByText('Required').nth(index).click()
        }
        if (col.columnType === BasicField.Dropdown) {
          await page
            .locator(`[id="columns\\.${index}\\.fieldOptions"]`)
            .fill(col.fieldOptions.join('\n'))
        }
      }
      break
  }

  await page.getByRole('button', { name: 'Create field' }).click()
  await expect(page.getByText(/the .* was created/i).first()).toBeVisible()
}

/** Adds all prescribed fields to the form.
 * Precondition: page must be currently on the admin builder page for the form.
 * @param {Page} page Playwright page
 * @param {E2eFieldMetadata[]} formFields the form fields to create
 */
export const addFields = async (
  page: Page,
  formFields: E2eFieldMetadata[],
): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  await page.getByRole('button', { name: 'Add fields' }).click()

  for (const field of formFields) {
    await createField(page, field)
  }
  await page.reload()
}
