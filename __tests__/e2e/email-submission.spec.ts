import { Page } from '@playwright/test'
import cuid from 'cuid'
import { BASICFIELD_TO_DRAWER_META } from 'frontend/src/features/admin-form/create/constants'
import { BasicField, FormField } from 'shared/types'

import { expect, test } from './fixtures/auth'
import { allFields } from './utils/field'

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

const addFields = async ({
  page,
  field,
}: {
  page: Page
  field: Pick<FormField, 'fieldType'>
}) => {
  await expect(page).toHaveURL(
    new RegExp('http://localhost:5000/admin/form/.*', 'i'),
  )

  await page.getByRole('button', { name: 'Add fields' }).click()

  const metadata = allFields[field.fieldType]
  const label = BASICFIELD_TO_DRAWER_META[field.fieldType].label

  await page.getByRole('button', { name: label }).click()

  // Enter title
  await page.getByLabel('Question').fill(metadata.title)
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

  await addFields({
    page,
    field: { fieldType: BasicField.ShortText },
  })
})
