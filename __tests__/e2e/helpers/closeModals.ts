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
  const pressEscape = async () => {
    await page.keyboard.press('Escape')
  }

  await page.addLocatorHandler(
    page.getByRole('dialog').filter({ hasText: 'New feature' }),
    pressEscape,
    { noWaitAfter: true },
  )

  await page.addLocatorHandler(
    page.getByRole('dialog', { name: 'Emergency contact' }),
    pressEscape,
    { noWaitAfter: true },
  )
}
