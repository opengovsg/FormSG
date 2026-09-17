import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'

const { WithWorkflowRedesignOn, WithWorkflow, NoCompletionEmailRedesignOn } =
  composeStories(pageStories)

const TRACKER_LABEL =
  /allow (people|respondents) to track their submission status/i
const PEEK_TITLE = /your workflow is ready/i
const ADD_STEP = { name: /add step/i }

describe('where the status tracker setting lives', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  const resetStore = (isGuidedSetup: boolean) =>
    act(() => {
      useAdminWorkflowStore.getState().reset()
      useAdminWorkflowStore.setState({
        isGuidedSetup,
        hasReachedCompletionEmail: false,
        hasSavedCompletionEmail: false,
      })
    })

  const finishTheEmailCard = () =>
    act(() => {
      useAdminWorkflowStore.getState().continueToEmailCard()
      useAdminWorkflowStore.getState().markCompletionEmailSaved()
      useAdminWorkflowStore.getState().setToInactive()
    })

  beforeEach(() => resetStore(true))

  afterEach(() => resetStore(true))

  const renderTab = async (Story: typeof WithWorkflowRedesignOn) => {
    await act(async () => {
      render(<Story />)
    })
    await screen.findByRole('button', ADD_STEP, { timeout: 10000 })
  }

  it('moves to a peek card under the completion email card in guided mode', async () => {
    await renderTab(WithWorkflowRedesignOn)
    await finishTheEmailCard()

    expect(await screen.findByText(PEEK_TITLE)).toBeInTheDocument()
    expect(screen.getAllByText(TRACKER_LABEL)).toHaveLength(1)
  })

  it('stays in the workflow card when guided setup is off', async () => {
    resetStore(false)
    await renderTab(WithWorkflowRedesignOn)

    expect(screen.queryByText(PEEK_TITLE)).not.toBeInTheDocument()
    expect(screen.getAllByText(TRACKER_LABEL)).toHaveLength(1)
  })

  it('leaves the flag-off builder alone', async () => {
    await renderTab(WithWorkflow)

    expect(screen.queryByText(PEEK_TITLE)).not.toBeInTheDocument()
    expect(screen.getAllByText(TRACKER_LABEL)).toHaveLength(1)
  })

  it('waits for the completion email card before showing', async () => {
    await renderTab(NoCompletionEmailRedesignOn)

    expect(screen.queryByText(PEEK_TITLE)).not.toBeInTheDocument()
    expect(screen.queryAllByText(TRACKER_LABEL)).toHaveLength(0)
  })

  it('appears once that card reports a save, and stays', async () => {
    await renderTab(NoCompletionEmailRedesignOn)
    await finishTheEmailCard()

    expect(await screen.findByText(PEEK_TITLE)).toBeInTheDocument()

    await act(async () => {
      useAdminWorkflowStore.getState().setToEditingEmailCard()
      useAdminWorkflowStore.getState().setToInactive()
    })

    expect(screen.getByText(PEEK_TITLE)).toBeInTheDocument()
  })

  it('shows no completion email card at all until the flow reaches it', async () => {
    await renderTab(WithWorkflowRedesignOn)

    expect(screen.queryByText(/end of workflow/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /completion email/i }),
    ).not.toBeInTheDocument()
  })
})
