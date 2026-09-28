import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'

const { WithWorkflowRedesignOn } = composeStories(pageStories)

const STEP_NAME_HINT = /name this step, or keep it as/i
const RESPONDENT_HINT = /select who fills in this step/i
const APPROVALS_HINT = /choose what they do in this step/i
const CONTINUE = { name: /^continue$/i }
const STEP_NAME_LABEL = /step name/i

describe('guided section hints', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  const openGuidedStep = async () => {
    render(<WithWorkflowRedesignOn />)
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setToCreating()
    })
    await screen.findByText(STEP_NAME_LABEL)
    return userEvent.setup()
  }

  it('hints the section the spotlight is on, and only that one', async () => {
    const user = await openGuidedStep()

    expect(screen.getByText(STEP_NAME_HINT)).toBeInTheDocument()
    expect(screen.queryByText(RESPONDENT_HINT)).not.toBeInTheDocument()

    await act(async () => {
      await user.click(screen.getByRole('button', CONTINUE))
    })

    expect(screen.getByText(RESPONDENT_HINT)).toBeInTheDocument()
    expect(screen.queryByText(STEP_NAME_HINT)).not.toBeInTheDocument()

    await act(async () => {
      await user.click(screen.getByRole('button', CONTINUE))
    })

    expect(screen.getByText(APPROVALS_HINT)).toBeInTheDocument()
    expect(screen.queryByText(RESPONDENT_HINT)).not.toBeInTheDocument()
  })

  it('stays quiet on a card opened for editing, which is not guided', async () => {
    render(<WithWorkflowRedesignOn />)
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setToEditing(1)
    })
    await screen.findByText(STEP_NAME_LABEL)

    expect(screen.queryByText(STEP_NAME_HINT)).not.toBeInTheDocument()
    expect(screen.queryByText(RESPONDENT_HINT)).not.toBeInTheDocument()
    expect(screen.queryByText(APPROVALS_HINT)).not.toBeInTheDocument()
  })
})
