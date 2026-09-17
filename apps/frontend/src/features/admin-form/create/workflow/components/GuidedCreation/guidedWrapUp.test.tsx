import { composeStories } from '@storybook/react'
import { act, fireEvent, render, screen } from '@testing-library/react'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'
import { GuidedWrapUp } from '../../types'

const { WithWorkflowRedesignOn } = composeStories(pageStories)

const EMAIL_SET_UP = /you've set up the completion email/i
const FINISHED = /you've finished guided setup/i
const TRACKER_LABEL =
  /allow (people|respondents) to track their submission status/i
const GUIDED_TOGGLE = /guided setup/i
const CONTINUE = { name: /^continue$/i }
const DONE = { name: /^done$/i }

describe('the guided wrap-up after the completion email', () => {
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
        guidedWrapUp: GuidedWrapUp.None,
      })
    })

  beforeEach(() => resetStore(true))
  afterEach(() => resetStore(true))

  const renderTab = async () => {
    await act(async () => {
      render(<WithWorkflowRedesignOn />)
    })
    await screen.findByRole('button', { name: /add step/i }, { timeout: 10000 })
  }

  const atStage = (stage: GuidedWrapUp) =>
    act(() => {
      useAdminWorkflowStore.getState().setGuidedWrapUp(stage)
    })

  it('keeps the status tracker under the guided setup toggle', async () => {
    await renderTab()

    const toggles = screen.getAllByRole('checkbox')
    const labels = toggles.map((toggle) => toggle.getAttribute('aria-label'))
    expect(labels.join(' ')).toMatch(GUIDED_TOGGLE)
    expect(screen.getAllByText(TRACKER_LABEL)).toHaveLength(1)
  })

  it('reports the email card, then hands over to the status tracker', async () => {
    await renderTab()
    await atStage(GuidedWrapUp.EmailSaved)

    expect(await screen.findByText(EMAIL_SET_UP)).toBeInTheDocument()
    expect(screen.queryByText(FINISHED)).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', CONTINUE))
    })

    expect(screen.queryByText(EMAIL_SET_UP)).not.toBeInTheDocument()
    expect(await screen.findByText(FINISHED)).toBeInTheDocument()
    expect(useAdminWorkflowStore.getState().guidedWrapUp).toBe(
      GuidedWrapUp.StatusTracking,
    )
  })

  it('dismisses the last card on Done, leaving the tracker in place', async () => {
    await renderTab()
    await atStage(GuidedWrapUp.StatusTracking)
    await screen.findByText(FINISHED)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', DONE))
    })

    expect(screen.queryByText(FINISHED)).not.toBeInTheDocument()
    expect(screen.getAllByText(TRACKER_LABEL)).toHaveLength(1)
  })

  it('stays quiet in manual mode at every stage', async () => {
    resetStore(false)
    await renderTab()
    await atStage(GuidedWrapUp.EmailSaved)
    expect(screen.queryByText(EMAIL_SET_UP)).not.toBeInTheDocument()

    await atStage(GuidedWrapUp.StatusTracking)
    expect(screen.queryByText(FINISHED)).not.toBeInTheDocument()
  })
})
