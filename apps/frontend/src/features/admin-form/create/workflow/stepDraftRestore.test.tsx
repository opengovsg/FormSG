import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from './adminWorkflowStore'
import * as pageStories from './CreatePageWorkflowTab.stories'

const { WithWorkflowRedesignOn } = composeStories(pageStories)

const STEP_NAME_LABEL = /step name/i
const TYPED_NAME = 'Head of dept'

describe('coming back from the field builder', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() =>
    act(() => {
      useAdminWorkflowStore.getState().clearStepDraft()
      useAdminWorkflowStore.getState().reset()
    }),
  )

  it('reopens the new step with what had been typed into it', async () => {
    const user = userEvent.setup()
    const view = render(<WithWorkflowRedesignOn />)
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setToCreating()
    })
    const nameInput = await screen.findByLabelText(STEP_NAME_LABEL)
    await act(async () => {
      await user.type(nameInput, TYPED_NAME)
    })

    await act(async () => {
      useAdminWorkflowStore.getState().stashStepDraft({
        step_name: TYPED_NAME,
        edit: [],
      })
    })

    view.unmount()
    render(<WithWorkflowRedesignOn />)

    expect(await screen.findByDisplayValue(TYPED_NAME)).toBeInTheDocument()
  })

  it('loses the step when nothing was stashed, as before', async () => {
    const view = render(<WithWorkflowRedesignOn />)
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setToCreating()
    })
    await screen.findByLabelText(STEP_NAME_LABEL)

    view.unmount()
    render(<WithWorkflowRedesignOn />)

    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    expect(screen.queryByLabelText(STEP_NAME_LABEL)).not.toBeInTheDocument()
  })
})
