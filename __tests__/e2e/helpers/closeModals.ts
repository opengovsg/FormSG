import { Page } from '@playwright/test'

/**
 * Closes any modals that may obstruct test flow,
 * such as the Rollout Announcement and Emergency Contact modals.
 *
 * These modals open only once the user has loaded, which can be after the page
 * looks ready, so a one-off visibility check can miss them. Locator handlers
 * instead close them whenever they show up before a later action.
 * @param {Page} page Playwright page
 */
export const closeModals = async (page: Page) => {
  const announcementModal = page
    .getByRole('dialog')
    .filter({ hasText: 'New feature' })
  await page.addLocatorHandler(announcementModal, async () => {
    await announcementModal.getByRole('button', { name: 'Cancel' }).click()
  })

  const emergencyContactModal = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Emergency Contact' }) })
  await page.addLocatorHandler(emergencyContactModal, async () => {
    await emergencyContactModal.locator('button[aria-label="Close"]').click()
  })
}
