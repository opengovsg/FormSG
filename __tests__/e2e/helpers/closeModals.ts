import { Page } from '@playwright/test';

/**
 * Closes any modals that may obstruct test flow,
 * such as the Rollout Announcement and Emergency Contact modals.
 * @param {Page} page Playwright page
 */
export const closeModals = async (
  page: Page,
) => {
  // Close the Rollout Announcement modal if it is visible.
  if (await page.getByText('New feature').isVisible()) {
    await page.getByRole('button', { name: 'Cancel' }).click()
  }

  // Close the Emergency Contact modal if it is visible.
  if (await page.getByRole('heading', { name: 'Emergency Contact' }).isVisible()) {
    await page.locator('button[aria-label="Close"]').click()
  }
}