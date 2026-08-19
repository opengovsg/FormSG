import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState } from '../../types'

import * as cardStories from './CompletionEmailBlock.stories'

const { WithWorkflow, WithWorkflowRedesignOn } = composeStories(pageStories)
const { Active } = composeStories(cardStories)

const SETTINGS_LINK = /email notifications/i
const DIVIDER = /end of workflow/i

describe('completion email seam', () => {
  // jsdom does not implement scrollIntoView, which the expanded card calls.
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

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

  // Save-before-switch is the one path that can lose an admin's edits, and it
  // already shipped a data-loss bug once (#9849), so it is worth rendering for.
  it('saves pending edits before handing over to another card', async () => {
    await act(async () => {
      render(<Active />)
    })

    // fireEvent rather than userEvent: the tag input manages its own roving
    // tabindex, which userEvent's focus handling does not drive in jsdom.
    const tagInput = await screen.findByRole('textbox', {}, { timeout: 10000 })
    await act(async () => {
      fireEvent.change(tagInput, {
        target: { value: 'newperson@example.gov.sg' },
      })
    })
    await act(async () => {
      fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' })
    })
    expect(
      await screen.findByText('newperson@example.gov.sg'),
    ).toBeInTheDocument()

    // Stands in for clicking a step card, which is what sets a pending switch.
    await act(async () => {
      useAdminWorkflowStore.getState().requestSwitchTo(0)
    })

    // The success toast is the observable proof that the edit was saved, not
    // merely dropped on the way to the next card.
    expect(
      await screen.findByText(/emails successfully updated/i),
    ).toBeInTheDocument()

    // And only then does the switch complete.
    await waitFor(() =>
      expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
        state: AdminEditWorkflowState.EditingStep,
        stepNumber: 0,
      }),
    )
  })
})
