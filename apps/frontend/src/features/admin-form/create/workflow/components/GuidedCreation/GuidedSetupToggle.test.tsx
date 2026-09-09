import { composeStories } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import * as pageStories from '../../CreatePageWorkflowTab.stories'
import { SPOTLIGHT_TEST_ID } from '../Spotlight'

const { WithWorkflowRedesignOn, WithWorkflow } = composeStories(pageStories)

const SWITCH = { name: /guided mode/i }
const CONFIRM = { name: /^skip guidance$/i }
const CONFIRM_TITLE = /skip guided setup\?/i

const bandCount = () => screen.queryAllByTestId(SPOTLIGHT_TEST_ID).length

const openTab = async (Story: typeof WithWorkflowRedesignOn) => {
  await act(async () => {
    render(<Story />)
  })
  await screen.findByRole('heading', { name: /^workflow$/i }, { timeout: 8000 })
  return userEvent.setup()
}

const openPacedStep = async () => {
  const ui = await openTab(WithWorkflowRedesignOn)
  await act(async () => {
    useAdminWorkflowStore.getState().setToCreating()
  })
  await waitFor(() => expect(bandCount()).toBe(1))
  return ui
}

describe('the Guided mode switch', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  // reset() deliberately leaves the guided mode choice alone, so each test has
  // to put it back itself.
  afterEach(() => {
    useAdminWorkflowStore.getState().reset()
    useAdminWorkflowStore.getState().setGuidedSetup(true)
  })

  it('sits in the workflow card, on by default', async () => {
    await openTab(WithWorkflowRedesignOn)

    expect(screen.getByRole('checkbox', SWITCH)).toBeChecked()
  })

  it('is absent with the redesign flag off', async () => {
    await openTab(WithWorkflow)

    expect(screen.queryByRole('checkbox', SWITCH)).not.toBeInTheDocument()
  })

  it('asks before switching off', async () => {
    const ui = await openTab(WithWorkflowRedesignOn)

    await act(async () => {
      await ui.click(screen.getByRole('checkbox', SWITCH))
    })

    expect(screen.getByText(CONFIRM_TITLE)).toBeInTheDocument()
    expect(useAdminWorkflowStore.getState().isGuidedSetup).toBe(true)
  })

  it.each([
    ['cancel', /^cancel$/i],
    ['the close icon', /close/i],
  ])('changes nothing on %s', async (_label, name) => {
    const ui = await openTab(WithWorkflowRedesignOn)

    await act(async () => {
      await ui.click(screen.getByRole('checkbox', SWITCH))
    })
    await act(async () => {
      await ui.click(screen.getByRole('button', { name }))
    })

    expect(useAdminWorkflowStore.getState().isGuidedSetup).toBe(true)
    expect(screen.getByRole('checkbox', SWITCH)).toBeChecked()
  })

  it('drops the pacing on confirm, keeping the step open', async () => {
    const ui = await openPacedStep()

    await act(async () => {
      await ui.click(screen.getByRole('checkbox', SWITCH))
    })
    await act(async () => {
      await ui.click(screen.getByRole('button', CONFIRM))
    })

    expect(bandCount()).toBe(0)
    expect(
      screen.queryByRole('button', { name: /^continue$/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/step name/i)).toBeInTheDocument()
  })

  it('puts the pacing back when switched on again, without asking', async () => {
    const ui = await openPacedStep()

    await act(async () => {
      await ui.click(screen.getByRole('checkbox', SWITCH))
    })
    await act(async () => {
      await ui.click(screen.getByRole('button', CONFIRM))
    })
    await waitFor(() =>
      expect(screen.queryByText(CONFIRM_TITLE)).not.toBeInTheDocument(),
    )

    await act(async () => {
      await ui.click(screen.getByRole('checkbox', SWITCH))
    })

    expect(screen.queryByText(CONFIRM_TITLE)).not.toBeInTheDocument()
    await waitFor(() => expect(bandCount()).toBe(1))
  })
})
