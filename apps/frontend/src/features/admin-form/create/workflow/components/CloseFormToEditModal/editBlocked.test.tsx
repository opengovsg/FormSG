import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'

const { WithWorkflowRedesignOn, NewStepOnPrivateFormRedesignOn } =
  composeStories(pageStories)

const BLOCKED_TITLE = /close your form first/i
const BLOCKED_BODY = /you can only edit your workflow when your form is closed/i
const STEP_NAME_LABEL = /step name/i
const ADD_STEP = { name: /add step/i }

describe('editing a workflow on a live form', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => act(() => useAdminWorkflowStore.getState().reset()))

  const mountTab = async (Story: typeof WithWorkflowRedesignOn) => {
    await act(async () => {
      render(<Story />)
    })
    await screen.findByRole('button', ADD_STEP, { timeout: 10000 })
  }

  it('asks the admin to close the form instead of opening a step', async () => {
    await mountTab(WithWorkflowRedesignOn)

    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /step 1/i })[0])
    })

    expect(await screen.findByText(BLOCKED_TITLE)).toBeInTheDocument()
    expect(screen.getByText(BLOCKED_BODY)).toBeInTheDocument()
    expect(screen.queryByText(STEP_NAME_LABEL)).not.toBeInTheDocument()
  })

  it('asks the same for Add step', async () => {
    await mountTab(WithWorkflowRedesignOn)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', ADD_STEP))
    })

    expect(await screen.findByText(BLOCKED_TITLE)).toBeInTheDocument()
    expect(screen.queryByText(STEP_NAME_LABEL)).not.toBeInTheDocument()
  })

  it('opens the step as before once the form is closed', async () => {
    await mountTab(NewStepOnPrivateFormRedesignOn)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', ADD_STEP))
    })

    expect(await screen.findByText(STEP_NAME_LABEL)).toBeInTheDocument()
    expect(screen.queryByText(BLOCKED_TITLE)).not.toBeInTheDocument()
  })
})
