import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState, GuidedWrapUp } from '../../types'
import { SPOTLIGHT_TEST_ID } from '../Spotlight'

import * as cardStories from './CompletionEmailBlock.stories'

const {
  WithWorkflow,
  WithWorkflowRedesignOn,
  WithWorkflowRedesignOnClosedForm,
  Step1RedesignOn,
} = composeStories(pageStories)
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

const resetStore = (isGuidedSetup: boolean) =>
  act(() => {
    useAdminWorkflowStore.getState().reset()
    useAdminWorkflowStore.setState({
      isGuidedSetup,
      guidedWrapUp: GuidedWrapUp.None,
    })
  })

describe('completion email seam', () => {
  beforeEach(() => resetStore(false))

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => resetStore(true))

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
      render(<WithWorkflowRedesignOnClosedForm />)
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

  beforeEach(() => resetStore(true))

  afterEach(() => resetStore(true))

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

  it('opens with every recipient control in one band', async () => {
    await declineAnotherStep()

    expect(screen.getByText(OTHERS)).toBeInTheDocument()
    expect(screen.getByText(STEP_ONE_FIELD)).toBeInTheDocument()
    expect(screen.getByText(WORKFLOW_STEPS)).toBeInTheDocument()
    expect(screen.queryAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(1)
  })

  it('offers Cancel and Done, with nothing to step through', async () => {
    await declineAnotherStep()

    expect(screen.getByRole('button', CANCEL)).toBeInTheDocument()
    expect(screen.getByRole('button', DONE)).toBeInTheDocument()
    expect(screen.queryByRole('button', CONTINUE)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', BACK)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', SAVE)).not.toBeInTheDocument()
  })

  it('returns to the report it came from when the admin cancels', async () => {
    await declineAnotherStep()

    await clickButton(CANCEL)

    expect(await screen.findByText(STEP_ONE_DONE)).toBeInTheDocument()
  })

  it('ends the flow when the admin is done, so the report does not return', async () => {
    await declineAnotherStep()

    await clickButton(DONE)

    await waitFor(() =>
      expect(useAdminWorkflowStore.getState().createOrEditData).toBeNull(),
    )
    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
  })

  it('keeps Save changes and all three sections when opened on its own', async () => {
    resetStore(false)
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

describe('when the workflow stops at step 1', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  beforeEach(() => resetStore(true))

  afterEach(() => resetStore(true))

  it('shows no completion email block at all', async () => {
    await act(async () => {
      render(<Step1RedesignOn />)
    })
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })

    expect(screen.queryByText(DIVIDER)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /completion email/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: SETTINGS_LINK }),
    ).not.toBeInTheDocument()
  })

  it('dismisses the report instead of handing over, since there is nowhere to go', async () => {
    await act(async () => {
      render(<Step1RedesignOn />)
    })
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setCompletedStep(0)
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', DECLINE))
    })

    expect(useAdminWorkflowStore.getState().createOrEditData).toBeNull()
    expect(useAdminWorkflowStore.getState().completedStepNumber).toBeNull()
    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
  })
})
