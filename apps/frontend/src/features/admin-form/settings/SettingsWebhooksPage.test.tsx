import { composeStories, composeStory } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'

import { FormResponseMode, WorkflowType } from 'formsg-shared/types/form'

import {
  getAdminFormSettings,
  getAdminFormView,
} from '~/mocks/msw/handlers/admin-form'

import * as stories from './SettingsWebhooksPage.stories'

const {
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
