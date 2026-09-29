import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from '../CreatePageWorkflowTab.stories'

const {
  NoWorkflowGenericWebhook,
  SingleStepGenericWebhook,
  SingleStepGenericWebhookRedesign,
  SingleStepPlumberWebhook,
} = composeStories(stories)

describe('webhook workflow restrictions', () => {
  beforeAll(() => {
    // jsdom does not implement scrolling when the step editor opens.
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView
  })

  it.each([
    ['original', SingleStepGenericWebhook],
    ['redesign', SingleStepGenericWebhookRedesign],
  ] as const)(
    'blocks a second step and links to webhook settings in the %s editor',
    async (_, Story) => {
      await act(async () => {
        render(<Story />)
      })

      expect(
        await screen.findByRole('button', { name: /add step/i }),
      ).toBeDisabled()
      expect(
        screen.getByRole('link', { name: 'webhook settings' }),
      ).toHaveAttribute('href', '/admin/form/12345/settings/webhooks')
    },
  )

  it.each([
    [
      'the first step with a generic webhook',
      NoWorkflowGenericWebhook,
      /create workflow/i,
    ],
    [
      'a second step with a Plumber webhook',
      SingleStepPlumberWebhook,
      /add step/i,
    ],
  ] as const)('lets admins start %s', async (_, Story, buttonName) => {
    const user = userEvent.setup()
    await act(async () => {
      render(<Story />)
    })

    await user.click(await screen.findByRole('button', { name: buttonName }))

    expect(
      await screen.findByRole('textbox', { name: /step name/i }),
    ).toBeEnabled()
  })
})
