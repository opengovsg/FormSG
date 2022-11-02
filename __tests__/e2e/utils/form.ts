import { Page } from '@playwright/test'
import cuid from 'cuid'

import { E2eFieldMetadata } from '../constants/field'
import { ADMIN_FORM_PAGE_PREFIX, DASHBOARD_PAGE } from '../constants/links'
import { expect } from '../fixtures/auth'

import { addFields } from './field'

/**
 * Navigates to the dashboard and creates a new form. Ends on the admin builder page.
 * @param {Page} page Playwright page
 * @returns {string} the created form url
 */
const addForm = async (page: Page): Promise<string> => {
  await page.goto(DASHBOARD_PAGE)

  // Press escape 5 times to get rid of any banners
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Create form' }).click()
  await page.getByLabel('Form name').fill(`e2e-test-${cuid()}`)

  await page.getByText('Email Mode').click()
  await page.getByRole('button', { name: 'Next step' }).click()
  await expect(page).toHaveURL(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/.*`, 'i'))

  const l = ADMIN_FORM_PAGE_PREFIX.length + 1
  const formId =
    page
      .url()
      .match(new RegExp(`${ADMIN_FORM_PAGE_PREFIX}/[a-fA-F0-9]{24}`))?.[0]
      .slice(l, l + 24) ?? ''

  // Clear any banners
  await page.getByRole('button', { name: 'Next' }).press('Escape')

  return formId
}

/** Goes to settings page and toggles form to be open.
 * Precondition: must be on the admin builder page with no dirty fields.
 * @param {Page} page Playwright page
 * @param {string} formId the formId
 */
const setFormToPublic = async (page: Page, formId: string): Promise<void> => {
  await page.getByText('Settings').click()
  await expect(page).toHaveURL(`${ADMIN_FORM_PAGE_PREFIX}/${formId}/settings`)

  await expect(
    page.getByText(/your form is closed to new responses/i),
  ).toBeVisible()

  await page
    .locator('label', {
      has: page.locator('[aria-label="Toggle form status"]'),
    })
    .click()
}

/**
 * Navigates to the dashboard and creates a new form with all the associated form settings.
 * @param {Page} page Playwright page
 * @returns {string} the created formId
 */
export const createForm = async (
  page: Page,
  { formFields }: { formFields: E2eFieldMetadata[] },
): Promise<string> => {
  const formId = await addForm(page)
  await addFields(page, formFields)
  await setFormToPublic(page, formId)

  return formId
}
