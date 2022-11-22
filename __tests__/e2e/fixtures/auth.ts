import { expect, test as baseTest } from '@playwright/test'
import fs from 'fs'
import path from 'path'

import { ADMIN_EMAIL } from '../constants'
import { DASHBOARD_PAGE, LOGIN_PAGE } from '../constants/links'
import { extractOtp } from '../utils/mail'

export { expect } from '@playwright/test'

/**
 * Creates the logged-in state for the playwright test worker before running the
 * tests on this worker.
 */
export const test = baseTest.extend({
  storageState: async ({ browser }, use, testInfo) => {
    // Override storage state, use worker index to look up logged-in info and generate it lazily.
    const fileName = path.join(
      testInfo.project.outputDir,
      'storage-' + testInfo.workerIndex,
    )
    if (!fs.existsSync(fileName)) {
      // Make sure we are not using any other storage state.
      const page = await browser.newPage({ storageState: undefined })
      await page.goto(LOGIN_PAGE)

      await page.getByRole('textbox', { name: /log in/i }).fill(ADMIN_EMAIL)
      await page.getByRole('button', { name: /log in/i }).click()

      // Ensure OTP success message is seen
      await expect(
        page.getByText(`Enter OTP sent to ${ADMIN_EMAIL}`),
      ).toBeVisible()

      // Log in with OTP
      const otp = await extractOtp(ADMIN_EMAIL)
      expect(otp).toBeTruthy()

      await page.locator('input[name="otp"]').fill(otp!)

      await page.getByRole('button', { name: 'Sign in' }).click()

      // Ensure logged in before saving storage state
      await expect(page).toHaveURL(DASHBOARD_PAGE)

      await page.context().storageState({ path: fileName })
      await page.close()
    }
    await use(fileName)
  },
})
