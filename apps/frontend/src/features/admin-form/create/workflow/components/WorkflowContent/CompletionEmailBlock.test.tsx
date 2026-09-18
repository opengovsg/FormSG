import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState } from '../../types'
import { SPOTLIGHT_TEST_ID } from '../Spotlight'

import * as cardStories from './CompletionEmailBlock.stories'

const { WithWorkflow, WithWorkflowRedesignOn } = composeStories(pageStories)
const { Active, SettingsError } = composeStories(cardStories)

const SETTINGS_LINK = /email notifications/i
const DIVIDER = /end of workflow/i
const STEP_ONE_DONE = /step 1 is the public-facing step/i
const DECLINE = { name: /no, i'm done/i }
const DONE = { name: /^done$/i }
const CANCEL = { name: /^cancel$/i }
const CONTINUE = { name: /^continue$/i }
const BACK = { name: /^back$/i }
const SAVE = { name: /save changes/i }
const OTHERS = /any email addresses you choose/i
const STEP_ONE_FIELD = /an email address collected from an email field/i
const WORKFLOW_STEPS = /people who fill in a workflow step/i

describe('completion email seam', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

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

  it('saves pending edits before handing over to another card', async () => {
    await act(async () => {
      render(<Active />)
    })

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

    await act(async () => {
      useAdminWorkflowStore.getState().requestSwitchTo(0)
    })

    expect(
      await screen.findByText(/emails successfully updated/i),
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
        state: AdminEditWorkflowState.EditingStep,
        stepNumber: 0,
      }),
    )
  })

  it('falls back to the Settings message when the settings request fails', async () => {
    await act(async () => {
      render(<SettingsError />)
    })

    expect(
      await screen.findByRole('link', { name: SETTINGS_LINK }),
    ).toBeInTheDocument()
    expect(screen.queryByText(DIVIDER)).not.toBeInTheDocument()
  })
  it('saves pending edits before Add step opens the new step form', async () => {
    await act(async () => {
      render(<WithWorkflowRedesignOn />)
    })

    const card = await screen.findByRole(
      'button',
      { name: /completion email/i },
      { timeout: 10000 },
    )
    await act(async () => {
      fireEvent.click(card)
    })

    const tagInput = await screen.findByRole('textbox', {}, { timeout: 10000 })
    await act(async () => {
      fireEvent.change(tagInput, {
        target: { value: 'newperson@example.gov.sg' },
      })
    })
    await act(async () => {
      fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add step/i }))
    })

    expect(
      await screen.findByText(/emails successfully updated/i),
    ).toBeInTheDocument()
  })
})

describe('guided handover to the completion email card', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  const declineAnotherStep = async () => {
    await act(async () => {
      render(<WithWorkflowRedesignOn />)
    })
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setCompletedStep(0)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', DECLINE))
    })
    await screen.findByText(OTHERS)
  }

  const clickButton = async (name: { name: RegExp }) => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', name))
    })
  }

  it('opens on the first recipient section, with nothing else revealed', async () => {
    await declineAnotherStep()

    expect(screen.getByText(OTHERS)).toBeInTheDocument()
    expect(screen.queryByText(STEP_ONE_FIELD)).not.toBeInTheDocument()
    expect(screen.queryByText(WORKFLOW_STEPS)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', SAVE)).not.toBeInTheDocument()
    expect(screen.getByRole('button', CONTINUE)).toBeInTheDocument()
  })

  it('reveals one recipient section per Continue, with a band on each', async () => {
    await declineAnotherStep()
    expect(screen.queryAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(1)

    await clickButton(CONTINUE)

    expect(screen.getByText(STEP_ONE_FIELD)).toBeInTheDocument()
    expect(screen.queryAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(2)

    await clickButton(CONTINUE)

    expect(screen.getByText(WORKFLOW_STEPS)).toBeInTheDocument()
    expect(screen.queryAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(3)
    expect(screen.getByRole('button', DONE)).toBeInTheDocument()
  })

  it('offers Back once past the first section, and Cancel on it', async () => {
    await declineAnotherStep()
    expect(screen.getByRole('button', CANCEL)).toBeInTheDocument()
    expect(screen.queryByRole('button', BACK)).not.toBeInTheDocument()

    await clickButton(CONTINUE)
    expect(screen.getByRole('button', BACK)).toBeInTheDocument()
    expect(screen.queryByRole('button', CANCEL)).not.toBeInTheDocument()

    await clickButton(BACK)

    expect(screen.queryByText(STEP_ONE_FIELD)).not.toBeInTheDocument()
    expect(screen.getByRole('button', CANCEL)).toBeInTheDocument()
  })

  it('returns to the report it came from when the admin cancels', async () => {
    await declineAnotherStep()

    await clickButton(CANCEL)

    expect(await screen.findByText(STEP_ONE_DONE)).toBeInTheDocument()
  })

  it('ends the flow when the admin is done, so the report does not return', async () => {
    await declineAnotherStep()
    await clickButton(CONTINUE)
    await clickButton(CONTINUE)

    await clickButton(DONE)

    await waitFor(() =>
      expect(useAdminWorkflowStore.getState().createOrEditData).toBeNull(),
    )
    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
  })

  it('keeps Save changes and all three sections when opened on its own', async () => {
    await act(async () => {
      render(<WithWorkflowRedesignOn />)
    })
    const card = await screen.findByRole(
      'button',
      { name: /completion email/i },
      { timeout: 10000 },
    )

    await act(async () => {
      fireEvent.click(card)
    })

    expect(await screen.findByRole('button', SAVE)).toBeInTheDocument()
    expect(screen.getByText(WORKFLOW_STEPS)).toBeInTheDocument()
    expect(screen.queryAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(0)
  })
})
