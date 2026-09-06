import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'

const { WithWorkflowRedesignOn, WithWorkflow } = composeStories(pageStories)

const STEP_ONE_DONE = /step 1 is the public-facing step/i
const STEP_TWO_DONE = /nice, step 2 is all set/i
const ADD_ANOTHER = { name: /yes, add a step/i }
const DECLINE = { name: /no, i'm done/i }

const renderWorkflow = async (Story: typeof WithWorkflowRedesignOn) => {
  await act(async () => {
    render(<Story />)
  })
  await screen.findByRole('button', { name: /add step/i }, { timeout: 4000 })
}

const finishCreating = async (stepNumber: number) => {
  await act(async () => {
    useAdminWorkflowStore.getState().setCompletedStep(stepNumber)
  })
}

describe('completion peek card after a step is built', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
    return i18n.changeLanguage(Language.ENGLISH)
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  it('reports step 1 in its own words, since its respondents are not chosen', async () => {
    await renderWorkflow(WithWorkflowRedesignOn)
    await finishCreating(0)

    expect(screen.getByText(STEP_ONE_DONE)).toBeInTheDocument()
    expect(screen.getByRole('button', ADD_ANOTHER)).toBeInTheDocument()
  })

  it('names a later step, counting from one', async () => {
    await renderWorkflow(WithWorkflowRedesignOn)
    await finishCreating(1)

    expect(screen.getByText(STEP_TWO_DONE)).toBeInTheDocument()
  })

  it('reports on the step that was built and no other', async () => {
    await renderWorkflow(WithWorkflowRedesignOn)
    await finishCreating(1)

    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
  })

  it('opens a new step card and stops reporting when another step is asked for', async () => {
    const user = userEvent.setup()
    await renderWorkflow(WithWorkflowRedesignOn)
    await finishCreating(0)

    await act(async () => {
      await user.click(screen.getByRole('button', ADD_ANOTHER))
    })

    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^continue$/i }),
    ).toBeInTheDocument()
  })

  it('goes away for good when the admin says they are done', async () => {
    const user = userEvent.setup()
    await renderWorkflow(WithWorkflowRedesignOn)
    await finishCreating(0)

    await act(async () => {
      await user.click(screen.getByRole('button', DECLINE))
    })

    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
    expect(useAdminWorkflowStore.getState().completedStepNumber).toBeNull()
  })

  it('stays out of the way while the step it reports on is open for editing', async () => {
    await renderWorkflow(WithWorkflowRedesignOn)
    await finishCreating(0)
    await act(async () => {
      useAdminWorkflowStore.getState().setToEditing(0)
    })

    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
  })

  it('does not appear with the redesign flag off', async () => {
    await renderWorkflow(WithWorkflow)
    await finishCreating(0)

    expect(screen.queryByText(STEP_ONE_DONE)).not.toBeInTheDocument()
  })
})

describe('what retires a completion report', () => {
  afterEach(() => useAdminWorkflowStore.getState().reset())

  it('drops it when a save was only clearing the way for another card', () => {
    const store = useAdminWorkflowStore.getState()
    store.requestSwitchTo(1)
    store.setCompletedStep(0)
    store.completeSave()

    expect(useAdminWorkflowStore.getState().completedStepNumber).toBeNull()
  })

  it('keeps it when a save finished a step and opened nothing', () => {
    const store = useAdminWorkflowStore.getState()
    store.setCompletedStep(0)
    store.completeSave()

    expect(useAdminWorkflowStore.getState().completedStepNumber).toBe(0)
  })
})
