import { Page } from '@playwright/test'
import cuid from 'cuid'

import { E2eFieldMetadata } from '../constants/field'
import { ADMIN_FORM_PAGE_PREFIX, DASHBOARD_PAGE } from '../constants/links'
import { expect } from '../fixtures/auth'

import { addFields } from './field'

/**
 * Navigates to the dashboard and creates a new form.
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

  // Clear any banners
  await page.getByRole('button', { name: 'Next' }).press('Escape')

  return page.url()
}

/**
 * Navigates to the dashboard and creates a new form with all the associated form settings.
 * @param {Page} page Playwright page
 * @returns {string} the created form url
 */
export const createForm = async (
  page: Page,
  { formFields }: { formFields: E2eFieldMetadata[] },
): Promise<string> => {
  const url = addForm(page)
  await addFields(page, formFields)

  return url
}
