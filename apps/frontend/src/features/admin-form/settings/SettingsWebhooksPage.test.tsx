import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as stories from './SettingsWebhooksPage.stories'

const {
  Error: ErrorStory,
  PlumberConnectedEmailMode,
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

  it('shows the Plumber message when a Plumber webhook is set on a form that cannot configure webhooks here', async () => {
    await act(async () => {
      render(<PlumberConnectedEmailMode />)
    })

    await screen.findByText(PLUMBER_CONNECTED_MSG)
    expect(screen.getByRole('link', { name: /plumber/i })).toBeInTheDocument()
    expect(screen.queryByText(UNSUPPORTED_MSG)).not.toBeInTheDocument()
  })

  it('keeps the webhook editor when a storage-mode form has a Plumber webhook', async () => {
    await act(async () => {
      render(<StorageModePlumberConnected />)
    })

    await screen.findByText(/endpoint url/i)
    expect(screen.queryByText(PLUMBER_CONNECTED_MSG)).not.toBeInTheDocument()
    expect(screen.queryByText(UNSUPPORTED_MSG)).not.toBeInTheDocument()
  })
})
