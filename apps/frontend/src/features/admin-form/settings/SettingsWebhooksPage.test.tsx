import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { composeStories, composeStory } from '@storybook/react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, WorkflowType } from 'formsg-shared/types/form'

import {
  getAdminFormSettings,
  getAdminFormView,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import * as stories from './SettingsWebhooksPage.stories'

const {
  MultiStepV4Webhook,
  V4Webhook,
  V4WebhookRolloutOff,
  RecoverableAdminFormError,
  MultiStepWorkflow,
  MultiStepPlumber,
  SingleStepGenericWebhook,
  Error: ErrorStory,
  StorageModePlumberConnected,
  UnsupportedEmailMode,
} = composeStories(stories)

const UNSUPPORTED_MSG = /webhooks are only available in storage mode/i
const PLUMBER_CONNECTED_MSG = /this form is connected to plumber/i
const ERROR_MSG = /couldn't load webhook settings/i

describe('SettingsWebhooksPage', () => {
  it('shows an error state, not the unsupported-mode message, when the settings fetch fails', async () => {
    await act(async () => {
      render(<ErrorStory />)
    })

    await screen.findByText(ERROR_MSG)
    // The error is announced to assistive tech (it appears after an async failure).
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(UNSUPPORTED_MSG)).not.toBeInTheDocument()
  })

  it('still shows the unsupported-mode message for a form whose mode genuinely lacks webhook support', async () => {
    await act(async () => {
      render(<UnsupportedEmailMode />)
    })

    await screen.findByText(UNSUPPORTED_MSG)
    expect(screen.queryByText(ERROR_MSG)).not.toBeInTheDocument()
    expect(screen.queryByText(PLUMBER_CONNECTED_MSG)).not.toBeInTheDocument()
  })

  it.each(['plumber.gov.sg', 'staging.plumber.gov.sg', 'uat.plumber.gov.sg'])(
    'shows the Plumber message for the %s webhook',
    async (hostname) => {
      const PlumberEnvironment = composeStory(
        {
          ...stories.PlumberConnectedEmailMode,
          parameters: {
            msw: {
              handlers: {
                default: [
                  getAdminFormSettings({
                    overrides: {
                      responseMode: FormResponseMode.Email,
                      webhook: {
                        url: `https://${hostname}/webhooks/abc`,
                        isRetryEnabled: false,
                      },
                    },
                  }),
                ],
              },
            },
          },
        },
        stories.default,
      )
      await act(async () => {
        render(<PlumberEnvironment />)
      })

      await screen.findByText(PLUMBER_CONNECTED_MSG)
      expect(screen.getByRole('link', { name: /plumber/i })).toBeInTheDocument()
      expect(screen.queryByText(UNSUPPORTED_MSG)).not.toBeInTheDocument()
    },
  )

  it('keeps the webhook editor when a storage-mode form has a Plumber webhook', async () => {
    await act(async () => {
      render(<StorageModePlumberConnected />)
    })

    await screen.findByText(/endpoint url/i)
    expect(screen.queryByText(PLUMBER_CONNECTED_MSG)).not.toBeInTheDocument()
    expect(screen.queryByText(UNSUPPORTED_MSG)).not.toBeInTheDocument()
  })
})

describe('legacy storage webhook notice', () => {
  const notice = /This form uses legacy webhooks/

  it.each([
    { name: 'empty URL', story: stories.StorageModeV4RolloutOn },
    {
      name: 'populated URL',
      story: stories.StorageModeV4RolloutOnWithWebhook,
    },
  ])('shows the notice with rollout enabled and $name', async ({ story }) => {
    const Case = composeStory(story, stories.default)
    await act(async () => {
      render(<Case />)
    })

    expect(await screen.findByText(notice)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'duplicate this form' }),
    ).toBeEnabled()
  })

  it.each([
    { name: 'empty URL', story: stories.StorageModeEmpty },
    { name: 'populated URL', story: stories.StorageModeRetryEnabled },
  ])('hides the notice with rollout disabled and $name', async ({ story }) => {
    const growthbook = new GrowthBook({
      features: {
        [featureFlags.enableMrfWebhooks]: { defaultValue: true },
        [featureFlags.mrfWebhooksV4]: { defaultValue: false },
      },
    })
    const Case = composeStory(
      {
        ...story,
        decorators: [
          (Story) => (
            <GrowthBookProvider growthbook={growthbook}>
              <Story />
            </GrowthBookProvider>
          ),
        ],
      },
      stories.default,
    )
    await act(async () => {
      render(<Case />)
    })

    await screen.findByRole('textbox')
    expect(screen.queryByText(notice)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'duplicate this form' }),
    ).not.toBeInTheDocument()
  })

  it('hides the storage notice for MRF forms with rollout enabled', async () => {
    await act(async () => {
      render(<V4Webhook />)
    })

    await screen.findByRole('checkbox', { name: 'Use legacy webhooks' })
    expect(screen.queryByText(notice)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'duplicate this form' }),
    ).not.toBeInTheDocument()
  })

  it('opens duplication for the current form and returns to unchanged settings on close', async () => {
    const user = userEvent.setup()
    const previewRequested = vi.fn()
    const story = stories.StorageModeV4RolloutOnMrfCutover
    const Case = composeStory(
      {
        ...story,
        parameters: {
          ...story.parameters,
          msw: {
            handlers: {
              ...story.parameters?.msw.handlers,
              duplication: [
                http.get(
                  '/api/v3/admin/forms/:formId/preview',
                  ({ params }) => {
                    previewRequested(params.formId)
                  },
                ),
                ...(story.parameters?.msw.handlers.duplication ?? []),
              ],
            },
          },
        },
      },
      stories.default,
    )
    await act(async () => {
      render(<Case />)
    })
    await user.click(
      await screen.findByRole('button', { name: 'duplicate this form' }),
    )

    const dialog = await screen.findByRole('dialog', { name: 'Duplicate form' })
    await waitFor(() =>
      expect(
        within(dialog).getByRole('textbox', { name: 'Form name' }),
      ).toHaveValue('Storage webhook form_1'),
    )
    expect(previewRequested).toHaveBeenCalledTimes(1)
    expect(previewRequested).toHaveBeenCalledWith('61540ece3d4a6e50ac0cc6ff')
    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('textbox')).toHaveValue(
      'https://example.com/webhook',
    )
    expect(
      screen.getByRole('checkbox', { name: 'Enable retries' }),
    ).toBeChecked()
    expect(screen.getByText(notice)).toBeInTheDocument()
  })
})

describe('webhook workflow guard', () => {
  it('refreshes the workflow restriction when returning from another browser tab', async () => {
    const step = {
      _id: 'step-0',
      workflow_type: WorkflowType.Static as const,
      emails: [],
      edit: [],
    }
    const workflow = [step]
    const UpdatedWorkflow = composeStory(
      {
        ...stories.SingleStepGenericWebhook,
        parameters: {
          msw: {
            handlers: {
              default: [
                getAdminFormView({
                  overrides: {
                    responseMode: FormResponseMode.Multirespondent,
                    workflow,
                  },
                }),
                ...stories.SingleStepGenericWebhook.parameters!.msw.handlers
                  .default,
              ],
            },
          },
        },
      },
      stories.default,
    )
    await act(async () => {
      render(<UpdatedWorkflow />)
    })
    expect(await screen.findByRole('textbox')).toBeEnabled()

    // Another tab saves a second step while this tab retains its cached form.
    workflow.push({ ...step, _id: 'step-1' })
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await screen.findByText(/reduce your workflow to one step/i)
    expect(screen.getByRole('textbox')).toBeDisabled()

    workflow.pop()
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    await waitFor(() => expect(screen.getByRole('textbox')).toBeEnabled())
    expect(
      screen.queryByText(/reduce your workflow to one step/i),
    ).not.toBeInTheDocument()
  })

  it('disables the URL and explains the restriction for two-step workflows', async () => {
    await act(async () => {
      render(<MultiStepWorkflow />)
    })
    await screen.findByText(/reduce your workflow to one step/i)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Plumber' })).toHaveAttribute(
      'href',
      'https://plumber.gov.sg/',
    )
  })

  it('keeps single-step webhooks editable without a separate removal action', async () => {
    await act(async () => {
      render(<SingleStepGenericWebhook />)
    })

    expect(await screen.findByRole('textbox')).toBeEnabled()
    expect(
      screen.queryByRole('button', { name: /remove webhook/i }),
    ).not.toBeInTheDocument()
  })

  it('keeps a multi-step Plumber URL locked while the V4 rollout is off', async () => {
    await act(async () => {
      render(<MultiStepPlumber />)
    })
    await screen.findByText(/reduce your workflow to one step/i)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('lets admins disconnect Plumber from a multi-step form', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<MultiStepPlumber />)
    })

    await user.click(
      await screen.findByRole('button', { name: /remove webhook/i }),
    )

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''))
    expect(
      screen.queryByRole('button', { name: /remove webhook/i }),
    ).not.toBeInTheDocument()
  })
})

describe('workflow details loading', () => {
  it('keeps webhook editing unavailable until workflow details arrive', async () => {
    let releaseResponse!: () => void
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    const PendingWorkflow = composeStory(
      {
        ...stories.SingleStepGenericWebhook,
        parameters: {
          msw: {
            handlers: {
              default: [
                // Hold only the HTTP boundary; the normal story handler supplies the response.
                http.get('/api/v3/admin/forms/:formId', async () => {
                  await responseReady
                }),
                ...stories.SingleStepGenericWebhook.parameters!.msw.handlers
                  .default,
              ],
            },
          },
        },
      },
      stories.default,
    )
    try {
      await act(async () => {
        render(<PendingWorkflow />)
      })
      await screen.findByRole('heading', { name: 'Webhooks' })
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    } finally {
      releaseResponse()
    }

    expect(await screen.findByRole('textbox')).toBeEnabled()
  })

  it('shows a recoverable error when settings succeed but the admin form fails', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<RecoverableAdminFormError />)
    })
    await screen.findByText(ERROR_MSG)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/reduce your workflow to one step/i),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(screen.getByRole('textbox')).toBeEnabled())
    expect(screen.getByRole('textbox')).toHaveValue(
      'https://example.com/webhook',
    )
    expect(screen.queryByText(ERROR_MSG)).not.toBeInTheDocument()
  })
})

describe('V4 webhooks', () => {
  it('allows editing a generic V4 URL on a multi-step form and disables legacy selection', async () => {
    await act(async () => {
      render(<MultiStepV4Webhook />)
    })
    expect(await screen.findByRole('textbox')).toBeEnabled()
    expect(
      screen.getByRole('checkbox', { name: 'Use legacy webhooks' }),
    ).toBeDisabled()
    expect(
      screen.queryByText(/Forms with two or more steps only support Plumber/),
    ).not.toBeInTheDocument()
  })
})

const renderToggleCase = async ({
  enabled,
  format,
  url,
  steps,
}: {
  enabled: boolean
  format?: 'v1' | 'v4'
  url: string
  steps: number
}) => {
  const growthbook = new GrowthBook({
    features: {
      [featureFlags.enableMrfWebhooks]: { defaultValue: true },
      [featureFlags.mrfWebhooksV4]: { defaultValue: enabled },
    },
  })
  const webhook = {
    url,
    isRetryEnabled: false,
    webhookFormat: format,
  }
  const Case = composeStory(
    {
      ...stories.SingleStepWorkflow,
      decorators: [
        (Story) => (
          <GrowthBookProvider growthbook={growthbook}>
            <Story />
          </GrowthBookProvider>
        ),
      ],
      parameters: {
        msw: {
          handlers: {
            default: [
              getAdminFormSettings({
                overrides: {
                  responseMode: FormResponseMode.Multirespondent,
                  webhook,
                },
              }),
              getAdminFormView({
                overrides: {
                  responseMode: FormResponseMode.Multirespondent,
                  workflow: Array.from({ length: steps }, (_, i) => ({
                    _id: `step-${i}`,
                    workflow_type: WorkflowType.Static,
                    emails: [],
                    edit: [],
                  })),
                },
              }),
              patchAdminFormSettings({
                overrides: {
                  responseMode: FormResponseMode.Multirespondent,
                  webhook,
                },
              }),
            ],
          },
        },
      },
    },
    stories.default,
  )
  await act(async () => {
    render(<Case />)
  })
  await screen.findByRole('textbox')
}

describe('legacy toggle decisions', () => {
  it.each(
    [false, true].flatMap((enabled) =>
      [undefined, 'v1', 'v4'].flatMap((format) =>
        [
          '',
          'https://example.com/hook',
          'https://plumber.gov.sg/webhooks/test',
        ].flatMap((url) =>
          [1, 2].map((steps) => ({ enabled, format, url, steps })),
        ),
      ),
    ),
  )(
    'flag $enabled, format $format, URL $url, steps $steps',
    async ({ enabled, format, url, steps }) => {
      await renderToggleCase({
        enabled,
        format: format as 'v1' | 'v4' | undefined,
        url,
        steps,
      })
      const toggle = screen.queryByRole('checkbox', {
        name: 'Use legacy webhooks',
      })
      if (!url.includes('plumber.gov.sg') && (enabled || format === 'v4')) {
        expect(toggle).toBeInTheDocument()
        expect(toggle).toHaveProperty('checked', format === 'v1')
        // Multi-step forms can leave legacy but not enter it.
        if (steps === 2 && format !== 'v1') expect(toggle).toBeDisabled()
        else expect(toggle).toBeEnabled()
      } else expect(toggle).not.toBeInTheDocument()
    },
  )

  it('lets a multi-step form with legacy chosen before any URL turn legacy off', async () => {
    await renderToggleCase({ enabled: true, format: 'v1', url: '', steps: 2 })
    const toggle = screen.getByRole('checkbox', { name: 'Use legacy webhooks' })
    expect(toggle).toBeChecked()
    expect(toggle).toBeEnabled()
    expect(screen.getByRole('textbox')).toBeDisabled()

    await userEvent.click(toggle)

    await waitFor(() => expect(toggle).not.toBeChecked())
    expect(screen.getByRole('textbox')).toBeEnabled()
  })

  it('saves legacy immediately without a confirmation modal', async () => {
    await act(async () => {
      render(<V4Webhook />)
    })
    const toggle = await screen.findByRole('checkbox', {
      name: 'Use legacy webhooks',
    })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toBeChecked())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).not.toBeChecked())
  })
})

it('hides format selection after switching V4 to legacy while rollout is off', async () => {
  await act(async () => {
    render(<V4WebhookRolloutOff />)
  })
  const toggle = await screen.findByRole('checkbox', {
    name: 'Use legacy webhooks',
  })
  await userEvent.click(toggle)
  await waitFor(() =>
    expect(
      screen.queryByRole('checkbox', { name: 'Use legacy webhooks' }),
    ).not.toBeInTheDocument(),
  )
})

it.each([stories.StorageModeEmpty, stories.UnsupportedEmailMode])(
  'never offers legacy selection on non-MRF forms even with rollout enabled',
  async (story) => {
    const growthbook = new GrowthBook({
      features: {
        [featureFlags.enableMrfWebhooks]: { defaultValue: true },
        [featureFlags.mrfWebhooksV4]: { defaultValue: true },
      },
    })
    const Case = composeStory(
      {
        ...story,
        decorators: [
          (Story) => (
            <GrowthBookProvider growthbook={growthbook}>
              <Story />
            </GrowthBookProvider>
          ),
        ],
      },
      stories.default,
    )
    await act(async () => {
      render(<Case />)
    })
    expect(
      screen.queryByRole('checkbox', { name: 'Use legacy webhooks' }),
    ).not.toBeInTheDocument()
  },
)
