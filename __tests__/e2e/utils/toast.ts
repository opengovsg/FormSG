import { expect, Page } from '@playwright/test'

/**
 * Expects a toast.
 * @param {Page} page the Playwright page
 * @param {string} message the toast string to expect
 */
export const expectToast = async (
  page: Page,
  message: RegExp,
): Promise<void> => {
  await expect(page.getByText(message).nth(0)).toBeVisible()
}
