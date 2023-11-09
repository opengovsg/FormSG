import { expect, test } from '@playwright/test'
import cuid from 'cuid'

import { DASHBOARD_PAGE, LOGIN_PAGE, ROOT_PAGE } from './constants'
import { extractOtp } from './utils'

test.describe('login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROOT_PAGE)
  })

  test('Reject emails that do not have white-listed domains', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /log in/i }).click()
    await expect(page).toHaveURL(LOGIN_PAGE)

    // Enter log in email.
    await page
      .getByRole('textbox', { name: /log in/i })
      .fill('user@non-white-listed-agency.com')

    await page
      .getByRole('button', { name: /log in/i })
      .first()
      .click()

    // Ensure error message is seen
    await expect(
      page.getByText('This is not a whitelisted public service email domain.'),
    ).toBeVisible()
  })

  test('Login success for white-listed domains', async ({ page }) => {
    // Create legit user.
    const legitUserEmail = `totally-legit-user${cuid()}@data.gov.sg`

    await page.getByRole('link', { name: 'Log in' }).click()
    await expect(page).toHaveURL(LOGIN_PAGE)

    await page.getByRole('textbox', { name: /log in/i }).fill(legitUserEmail)
    await page
      .getByRole('button', { name: /log in/i })
      .first()
      .click()

    // Ensure OTP success message is seen
    await expect(
      page.getByText(`Enter OTP sent to ${legitUserEmail}`),
    ).toBeVisible()

    // Log in with OTP
    const otp = await extractOtp(legitUserEmail)
    expect(otp).toBeTruthy()

    await page.locator('input[name="otp"]').fill(otp!)

    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(DASHBOARD_PAGE)
  })

  test('Prevent login if OTP is incorrect', async ({ page }) => {
    // Create legit user.
    const legitUserEmail = `totally-legit-user${cuid()}@data.gov.sg`

    await page.getByRole('link', { name: 'Log in' }).click()
    await expect(page).toHaveURL(LOGIN_PAGE)

    await page.getByRole('textbox', { name: /log in/i }).fill(legitUserEmail)
    await page
      .getByRole('button', { name: /log in/i })
      .first()
      .click()

    // Ensure OTP success message is seen
    await expect(
      page.getByText(`Enter OTP sent to ${legitUserEmail}`),
    ).toBeVisible()

    // Get OTP
    const otp = await extractOtp(legitUserEmail)

    // Increment OTP by 1, keep to 6 digits
    const newOtp = String(parseInt(otp!, 10) + 1).slice(0, 6)

    await page.locator('input[name="otp"]').fill(newOtp)

    await page.getByRole('button', { name: 'Sign in' }).click()
    // Ensure error message is seen
    await expect(page.getByText('OTP is invalid.')).toBeVisible()
  })
})
