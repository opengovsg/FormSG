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

  afterEach(() =>
    act(() => {
      useAdminWorkflowStore.getState().reset()
      useAdminWorkflowStore.setState({
        isGuidedSetup: true,
        hasSavedCompletionEmail: false,
      })
    }),
  )

  const renderTab = async (Story: typeof WithWorkflowRedesignOn) => {
    await act(async () => {
      render(<Story />)
    })
    await screen.findByRole('button', ADD_STEP, { timeout: 10000 })
  }

  it('moves to a peek card under the completion email card in guided mode', async () => {
    await renderTab(WithWorkflowRedesignOn)

    expect(await screen.findByText(PEEK_TITLE)).toBeInTheDocument()
    expect(screen.getAllByText(TRACKER_LABEL)).toHaveLength(1)
  })

  it('stays in the workflow card when guided setup is off', async () => {
    await renderTab(WithWorkflowRedesignOn)
    await act(async () => {
      useAdminWorkflowStore.getState().setGuidedSetup(false)
    })

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

    await act(async () => {
      useAdminWorkflowStore.getState().markCompletionEmailSaved()
    })

    expect(await screen.findByText(PEEK_TITLE)).toBeInTheDocument()

    await act(async () => {
      useAdminWorkflowStore.getState().setToEditingEmailCard()
      useAdminWorkflowStore.getState().setToInactive()
    })

    expect(screen.getByText(PEEK_TITLE)).toBeInTheDocument()
  })
})
