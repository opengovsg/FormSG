import { expect, test } from '@playwright/test'

test('a mouse drag on a setup-only field opens one modal without dropping the field', async ({
  page,
}) => {
  const story =
    'features-adminform-create-builder-and-design-builderanddesigndrawer-fieldlistdrawer--missing-provider-fields-disabled'
  await page.goto(`/iframe.html?id=${story}&viewMode=story`)
  await page.getByRole('tab', { name: /singpass/i }).click()
  const field = page.getByRole('button', { name: 'Name', exact: true })
  await field.scrollIntoViewIfNeeded()
  // Observe the native drop, even if the pointer finishes outside the drawer.
  const drag = await page.evaluateHandle(() => {
    const observed = { drops: 0 }
    document.addEventListener(
      'drop',
      () => {
        observed.drops++
      },
      true,
    )
    return observed
  })
  const bounds = await field.boundingBox()
  if (!bounds) throw new Error('Field row is hidden')
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  try {
    await page.mouse.move(x + 80, y + 10, { steps: 10 })
    await expect(
      page.getByRole('dialog', { name: 'Set up Singpass login' }),
    ).toBeVisible()
  } finally {
    await page.mouse.up()
  }
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(field).toBeVisible()
  expect(await drag.jsonValue()).toEqual({ drops: 0 })
})
