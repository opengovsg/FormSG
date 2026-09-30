import { composeStories, composeStory } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormResponseMode, WorkflowType } from 'formsg-shared/types/form'

import { getAdminFormView } from '~/mocks/msw/handlers/admin-form'

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
    ['original', stories.SingleStepGenericWebhook],
    ['redesign', stories.SingleStepGenericWebhookRedesign],
  ] as const)(
    'refreshes the webhook restriction on window focus in the %s editor',
    async (_, story) => {
      const webhook = { url: '', isRetryEnabled: false }
      const UpdatedWebhook = composeStory(
        {
          ...story,
          parameters: {
            msw: {
              handlers: {
                default: [
                  getAdminFormView({
                    overrides: {
                      responseMode: FormResponseMode.Multirespondent,
                      workflow: [
                        {
                          _id: 'step-0',
                          workflow_type: WorkflowType.Static,
                          emails: [],
                          edit: [],
                        },
                      ],
                      webhook,
                    },
                  }),
                  ...story.parameters!.msw.handlers.default,
                ],
              },
            },
          },
        },
        stories.default,
      )
      await act(async () => {
        render(<UpdatedWebhook />)
      })
      expect(
        await screen.findByRole('button', { name: /add step/i }),
      ).toBeEnabled()

      // Another tab adds a webhook while this tab retains its cached form.
      webhook.url = 'https://example.com/webhook'
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /add step/i }),
        ).toBeDisabled(),
      )
      expect(
        screen.getByRole('link', { name: 'webhook settings' }),
      ).toBeInTheDocument()

      webhook.url = ''
      act(() => {
        window.dispatchEvent(new Event('focus'))
      })
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /add step/i })).toBeEnabled(),
      )
      expect(
        screen.queryByRole('link', { name: 'webhook settings' }),
      ).not.toBeInTheDocument()
    },
  )

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
