import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'

const { Step3ApprovalRedesignOn } = composeStories(pageStories)

const APPROVAL_TOGGLE = { name: /make this person approve/i }
const CHOSEN_FIELD = /approve time off\?/i
const APPROVAL_STEP_NUMBER = 2

describe('the approval toggle', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  const openApprovalStep = async () => {
    await act(async () => {
      render(<Step3ApprovalRedesignOn />)
    })
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
    await act(async () => {
      useAdminWorkflowStore.getState().setToEditing(APPROVAL_STEP_NUMBER)
    })
    return userEvent.setup()
  }

  const chosenFieldMentions = () => screen.queryAllByText(CHOSEN_FIELD).length

  it('puts the chosen field back when it is switched off and on again', async () => {
    const user = await openApprovalStep()
    const toggle = await screen.findByRole('checkbox', APPROVAL_TOGGLE)
    expect(toggle).toBeChecked()
    const withSelector = chosenFieldMentions()

    await act(async () => {
      await user.click(toggle)
    })
    expect(chosenFieldMentions()).toBe(withSelector - 1)

    await act(async () => {
      await user.click(screen.getByRole('checkbox', APPROVAL_TOGGLE))
    })

    expect(chosenFieldMentions()).toBe(withSelector)
  })
})
