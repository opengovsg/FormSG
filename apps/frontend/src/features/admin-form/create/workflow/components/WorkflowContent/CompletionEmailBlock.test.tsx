import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as pageStories from '../../CreatePageWorkflowTab.stories'

import * as blockStories from './CompletionEmailBlock.stories'

const { WithWorkflow, WithWorkflowRedesignOn } = composeStories(pageStories)
const { SettingsError } = composeStories(blockStories)

const SETTINGS_LINK = /email notifications/i
const DIVIDER = /end of workflow/i

describe('completion email seam', () => {
  // The flag-off path must stay exactly as it was: an inline message pointing
  // at Settings, with no trace of the new card.
  it('keeps the Settings inline message when the redesign flag is off', async () => {
    await act(async () => {
      render(<WithWorkflow />)
    })

    expect(
      await screen.findByRole('link', { name: SETTINGS_LINK }),
    ).toBeInTheDocument()
    expect(screen.queryByText(DIVIDER)).not.toBeInTheDocument()
  })

  it('replaces the inline message with the card when the flag is on', async () => {
    await act(async () => {
      render(<WithWorkflowRedesignOn />)
    })

    expect(await screen.findByText(DIVIDER)).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: SETTINGS_LINK }),
    ).not.toBeInTheDocument()
  })
  // A failed settings request leaves `data` undefined, exactly as one still in
  // flight does, so the card would otherwise skeleton with no error and no
  // retry. The fallback keeps a working route to Settings.
  it('falls back to the Settings message when the settings request fails', async () => {
    await act(async () => {
      render(<SettingsError />)
    })

    expect(
      await screen.findByRole('link', { name: SETTINGS_LINK }),
    ).toBeInTheDocument()
    expect(screen.queryByText(DIVIDER)).not.toBeInTheDocument()
  })
})
