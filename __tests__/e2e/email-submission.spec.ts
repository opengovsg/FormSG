import { Page } from '@playwright/test'
import cuid from 'cuid'
import { BASICFIELD_TO_DRAWER_META } from 'frontend/src/features/admin-form/create/constants'
import { BasicField } from 'shared/types'

import { expect, test } from './fixtures/auth'
import { allFields, E2eFieldMetadata } from './utils/field'

const ROOT_PAGE = 'http://localhost:5000'
const DASHBOARD_PAGE = `${ROOT_PAGE}/dashboard`

const createForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Create form' }).click()
  await page.getByLabel('Form name').fill(`e2e-test-${cuid()}`)

  await page.getByText('Email Mode').click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page).toHaveURL(
    new RegExp('http://localhost:5000/admin/form/.*', 'i'),
  )
  // Clear any banners
  await page.getByRole('button', { name: 'Next' }).press('Escape')
}

const createField = async ({
  page,
  metadata,
}: {
  page: Page
  metadata: E2eFieldMetadata
}) => {
  const label = BASICFIELD_TO_DRAWER_META[metadata.fieldType].label

  await page.getByRole('button', { name: label }).click()

  // Enter title
  if (metadata.fieldType === BasicField.Section) {
    await page.getByLabel('Section heading').fill(metadata.title)
  } else {
    await page.getByLabel('Question').fill(metadata.title)
  }
  if (metadata.required === false && metadata.fieldType !== BasicField.Table) {
    await page.getByText('Required').click()
  }

  switch (metadata.fieldType) {
    case BasicField.Email:
      if (metadata.isVerifiable) {
        await page.locator('label:has-text("OTP verification")').click()
      }
      break
    case BasicField.Dropdown:
      {
        const optionsString = metadata.fieldOptions.join('\n')
        await page.getByLabel('Options').fill(optionsString)
      }
      break
    case BasicField.Checkbox:
    case BasicField.Radio:
      {
        const optionsString = metadata.fieldOptions.join('\n')
        await page
          .getByPlaceholder('Enter one option per line')
          .fill(optionsString)
        if (metadata.othersRadioButton) {
          await page.getByText('Others').click()
        }
      }
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
    case BasicField.Attachment:
      await page.getByLabel('Maximum size of individual attachment').click()
      await page
        .getByRole('option', { name: `${metadata.attachmentSize} MB` })
        .click()
  }

  await page.getByRole('button', { name: 'Create field' }).click()
  await expect(
    page.getByText(`The field "${metadata.title}" was created.`).first(),
  ).toBeVisible()
}

const addFields = async ({
  page,
  fieldType,
}: {
  page: Page
  fieldType: BasicField
}) => {
  await expect(page).toHaveURL(
    new RegExp('http://localhost:5000/admin/form/.*', 'i'),
  )

  await page.getByRole('button', { name: 'Add fields' }).click()

  const metadata = allFields[fieldType]
  if (!metadata) return
  await createField({ page, metadata })
}

test('Homepage', async ({ page }) => {
  await page.goto(DASHBOARD_PAGE)

  // Press escape 5 times to get rid of any banners
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await createForm(page)

  for (const fieldType of Object.values(BasicField)) {
    await addFields({
      page,
      fieldType,
    })
  }
})
