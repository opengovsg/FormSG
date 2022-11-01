import { expect, Page } from '@playwright/test'
import { format } from 'date-fns'
import { BASICFIELD_TO_DRAWER_META } from 'frontend/src/features/admin-form/create/constants'
import { BasicField, DateSelectedValidation } from 'shared/types'

import { allFields, E2eFieldMetadata } from '../constants/field'
import { ADMIN_FORM_PAGE_PREFIX } from '../constants/links'

const NON_INPUT_FIELD_TYPES = [
  BasicField.Section,
  BasicField.Image,
  BasicField.Statement,
]

export const createField = async ({
  page,
  metadata,
}: {
  page: Page
  metadata: E2eFieldMetadata
}): Promise<void> => {
  const label = BASICFIELD_TO_DRAWER_META[metadata.fieldType].label
  const isNonInput = NON_INPUT_FIELD_TYPES.includes(metadata.fieldType)
  await page.getByRole('button', { name: label }).click()

  // Enter title for input fields and Section
  if (isNonInput) {
    if (metadata.fieldType === BasicField.Section) {
      await page.getByLabel('Section heading').fill(metadata.title)
    }
    // Images and Statements don't have titles
  } else {
    await page.getByLabel('Question').fill(metadata.title)
  }

  // Toggle required for input fields except Table field (required toggled for individual columns)
  if (
    !isNonInput &&
    metadata.fieldType !== BasicField.Table &&
    metadata.required === false
  ) {
    await page.getByText('Required').click()
  }

  // Enter field description.
  if (metadata.description) {
    if (metadata.fieldType === BasicField.Statement) {
      await page.getByLabel('Paragraph').fill(metadata.description)
    } else {
      await page.getByLabel('Description').fill(metadata.description)
    }
  }

  // Handle the rest of the individual fields.
  switch (metadata.fieldType) {
    case BasicField.Attachment:
      await page.getByLabel('Maximum size of individual attachment').click()
      await page
        .getByRole('option', { name: `${metadata.attachmentSize} MB` })
        .click()
      break
    case BasicField.Checkbox:
      {
        if (metadata.othersRadioButton) {
          await page.getByText('Others').first().click()
        }
        const optionsString = metadata.fieldOptions.join('\n')
        await page.getByLabel('Options').fill(optionsString)
        if (metadata.validateByValue) {
          await page.getByLabel('Selection limits').click()
          if (metadata.ValidationOptions.customMin) {
            await page
              .getByPlaceholder('Minimum')
              .fill(metadata.ValidationOptions.customMin.toString())
          }
          if (metadata.ValidationOptions.customMax) {
            await page
              .getByPlaceholder('Maximimum')
              .fill(metadata.ValidationOptions.customMax.toString())
          }
        }
      }
      break
    case BasicField.Date:
      {
        if (!metadata.dateValidation.selectedDateValidation) break
        await page.getByRole('combobox').first().click()
        await page
          .getByText(metadata.dateValidation.selectedDateValidation)
          .click()
        if (
          metadata.dateValidation.selectedDateValidation ===
          DateSelectedValidation.Custom
        ) {
          if (metadata.dateValidation.customMinDate) {
            await page
              .locator('[name="dateValidation.customMinDate"]')
              .fill(format(metadata.dateValidation.customMinDate, 'dd/MM/yyyy'))
          }
          if (metadata.dateValidation.customMaxDate) {
            await page
              .locator('[name="dateValidation.customMaxDate"]')
              .fill(format(metadata.dateValidation.customMaxDate, 'dd/MM/yyyy'))
          }
        }
      }
      break
    case BasicField.Dropdown:
      {
        const optionsString = metadata.fieldOptions.join('\n')
        await page.getByLabel('Options').fill(optionsString)
      }
      break

    case BasicField.Email:
      if (metadata.isVerifiable) {
        await page.locator('label:has-text("OTP verification")').click()
      }
      break

    case BasicField.Image:
      await page.setInputFiles('input[type="file"]', metadata.path)
      break
    case BasicField.Rating:
      await page.getByLabel('Number of steps').click()
      await page
        .getByRole('option', { name: String(metadata.ratingOptions.steps) })
        .click()
      await page.getByLabel('Shape').click()
      await page
        .getByRole('option', { name: metadata.ratingOptions.shape })
        .click()
      break
    case BasicField.Table:
      await page.getByLabel('Minimum rows').fill(String(metadata.minimumRows))
      if (metadata.addMoreRows) {
        await page.getByText('Allow respondent to add more rows').click()
        if (metadata.maximumRows) {
          await page
            .getByLabel('Maximum rows allowed')
            .fill(String(metadata.maximumRows))
        }
      }
      // First table option
      for (let index = 0; index < metadata.columns.length; index++) {
        const col = metadata.columns[index]
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
          await page.getByLabel('Required').nth(index).click()
        }
        if (col.columnType === BasicField.Dropdown) {
          await page
            .locator(`[id="columns\\.${index}\\.fieldOptions"]`)
            .fill(col.fieldOptions.join('\n'))
        }
      }
      break
    case BasicField.Decimal:
      if (metadata.validateByValue) {
        await page.getByText('Number validation').click()
        if (metadata.ValidationOptions.customMin) {
          await page
            .getByRole('spinbutton', { name: 'Minimum value' })
            .fill(String(metadata.ValidationOptions.customMin))
        }
        if (metadata.ValidationOptions.customMax) {
          await page
            .getByRole('spinbutton', { name: 'Maximum value' })
            .fill(String(metadata.ValidationOptions.customMax))
        }
      }
      break
  }

  await page.getByRole('button', { name: 'Create field' }).click()
  await expect(page.getByText(/the .* was created/i).first()).toBeVisible()
}

export const addFields = async ({
  page,
  fieldType,
}: {
  page: Page
  fieldType: BasicField
}): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  await page.getByRole('button', { name: 'Add fields' }).click()

  const metadata = allFields[fieldType]
  if (!metadata) return
  await createField({ page, metadata })
}
