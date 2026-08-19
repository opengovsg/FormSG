import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as pageStories from '../../CreatePageWorkflowTab.stories'

const { WithWorkflow, WithWorkflowRedesignOn } = composeStories(pageStories)

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
})
