import { Page } from '@playwright/test'
import cuid from 'cuid'
import { BasicField } from 'shared/types'

import { ADMIN_FORM_PAGE_PREFIX, DASHBOARD_PAGE } from './constants/links'
import { expect, test } from './fixtures/auth'
import { addFields } from './utils/field'

const createForm = async (page: Page) => {
  await page.getByRole('button', { name: 'Create form' }).click()
  await page.getByLabel('Form name').fill(`e2e-test-${cuid()}`)

  await page.getByText('Email Mode').click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  // Clear any banners
  await page.getByRole('button', { name: 'Next' }).press('Escape')
}

test.describe('email form submission', () => {
  test('Create simple email mode form', async ({ page }) => {
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
})
