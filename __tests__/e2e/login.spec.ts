import { expect, test } from '@playwright/test'
import mongoose from 'mongoose'

const LANDING_PAGE = 'http://localhost:5000'

test.describe('login', () => {
  test.beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await mongoose.connect(process.env['MONGO_URI']!)
  })
  test.afterAll(async () => {
    await mongoose.disconnect()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto(LANDING_PAGE)
  })

  test('Login success for white-listed domains', async ({ page }) => {
    await page.getByRole('link', { name: 'Log in' }).click()
    await expect(page).toHaveURL(`${LANDING_PAGE}/login`)

    await page
      .getByPlaceholder('e.g. jane@data.gov.sg')
      .fill('test@open.gov.sg')

    // await page.getByRole('button', { name: 'Log in' }).click()

    // await page1.goto('http://localhost:1080/')

    // await page1.goto('http://localhost:1080/#/')

    // await page1
    //   .getByRole('link', {
    //     name: 'One-Time Password (OTP) for FormSG To: test@open.gov.sg 2022-10-10 16:39:51 (+0800)',
    //   })
    //   .click()
    // await expect(page1).toHaveURL('http://localhost:1080/#/email/7GriKlvL')

    // await page1.frameLocator('iframe >> nth=0').getByText('995702').dblclick()

    // await page1
    //   .frameLocator('iframe >> nth=0')
    //   .getByText(
    //     'Your OTP is 995702. Please use this to log in to your FormSG account. If your OT',
    //   )
    //   .press('Meta+c')

    // await page.locator('input[name="otp"]').fill('npx pl')

    // await page.locator('input[name="otp"]').press('Meta+a')

    // await page.locator('input[name="otp"]').fill('')

    // await page1.frameLocator('iframe >> nth=0').getByText('995702').click()

    // await page.locator('input[name="otp"]').fill('995702')

    // await page.getByRole('button', { name: 'Sign in' }).click()
    // await expect(page).toHaveURL('http://localhost:3000/dashboard')
  })
})
