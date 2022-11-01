import { expect, test as baseTest } from '@playwright/test'
import fs from 'fs'
import path from 'path'

import { DASHBOARD_PAGE, LOGIN_PAGE } from '../constants/links'
import { extractOtp } from '../utils/mail'

export { expect } from '@playwright/test'

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

      const email = `user${testInfo.workerIndex}@data.gov.sg`

      await page.getByRole('textbox', { name: /log in/i }).fill(email)
      await page.getByRole('button', { name: /log in/i }).click()

      // Ensure OTP success message is seen
      await expect(page.getByText(`Enter OTP sent to ${email}`)).toBeVisible()

      // Log in with OTP
      const otp = await extractOtp(email)
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
