import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'
import { SPOTLIGHT_TEST_ID } from '../../Spotlight'

const {
  NoWorkflowRedesignOn,
  WithWorkflowRedesignOn,
  WithWorkflow,
  NewStepOnPrivateFormRedesignOn,
} = composeStories(pageStories)

const STEP_NAME_LABEL = /step name/i
const PEOPLE_LABEL = /who fills in this step/i
const WHAT_THEY_DO_LABEL = /make this person approve/i
const FIELDS_LABEL = /choose the fields this person fills in/i

const CONTINUE = { name: /^continue$/i }
const BACK = { name: /^back$/i }
const CANCEL = { name: /^cancel$/i }
const DONE = { name: /^done$/i }

const bandCount = () => screen.queryAllByTestId(SPOTLIGHT_TEST_ID).length

const findOpenCard = () =>
  screen.findByText(STEP_NAME_LABEL, {}, { timeout: 10000 })

const openNewStepCard = async (Story: typeof NoWorkflowRedesignOn) => {
  await act(async () => {
    render(<Story />)
  })
  await act(async () => {
    useAdminWorkflowStore.getState().setToCreating()
  })
  await findOpenCard()
  return userEvent.setup()
}

describe('one decision at a time', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  describe('building step 1', () => {
    it('asks only for the step name, with nothing to go back to', async () => {
      await openNewStepCard(NoWorkflowRedesignOn)

      expect(screen.getByText(STEP_NAME_LABEL)).toBeInTheDocument()
      expect(screen.queryByText(PEOPLE_LABEL)).not.toBeInTheDocument()
      expect(bandCount()).toBe(1)

      expect(screen.getByRole('button', CONTINUE)).toBeInTheDocument()
      expect(screen.queryByRole('button', BACK)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', CANCEL)).not.toBeInTheDocument()
    })

    it('reveals the next decision on Continue, and offers Back once there is one', async () => {
      const user = await openNewStepCard(NoWorkflowRedesignOn)

      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })

      expect(screen.getByText(PEOPLE_LABEL)).toBeInTheDocument()
      expect(bandCount()).toBe(2)
      expect(screen.getByRole('button', BACK)).toBeInTheDocument()
    })

    it('offers Done rather than Continue once the last decision is on screen', async () => {
      const user = await openNewStepCard(NoWorkflowRedesignOn)

      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })
      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })

      expect(screen.getByText(FIELDS_LABEL)).toBeInTheDocument()
      expect(screen.queryByText(WHAT_THEY_DO_LABEL)).not.toBeInTheDocument()
      expect(bandCount()).toBe(3)
      expect(screen.getByRole('button', DONE)).toBeInTheDocument()
      expect(screen.queryByRole('button', CONTINUE)).not.toBeInTheDocument()
    })

    it('takes the revealed decision back off screen on Back', async () => {
      const user = await openNewStepCard(NoWorkflowRedesignOn)

      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })
      await act(async () => {
        await user.click(screen.getByRole('button', BACK))
      })

      expect(screen.queryByText(PEOPLE_LABEL)).not.toBeInTheDocument()
      expect(bandCount()).toBe(1)
    })
  })

  describe('building a later step', () => {
    it('is paced the same way, and offers Cancel where step 1 offers nothing', async () => {
      await openNewStepCard(WithWorkflowRedesignOn)

      expect(bandCount()).toBe(1)
      expect(screen.getByRole('button', CONTINUE)).toBeInTheDocument()
      expect(screen.getByRole('button', CANCEL)).toBeInTheDocument()
    })

    it('asks what they do, which step 1 has no section for', async () => {
      const user = await openNewStepCard(WithWorkflowRedesignOn)

      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })
      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })

      expect(screen.getByText(WHAT_THEY_DO_LABEL)).toBeInTheDocument()
      expect(bandCount()).toBe(3)
      expect(screen.getByRole('button', CONTINUE)).toBeInTheDocument()
    })
  })

  describe('re-opening a saved step', () => {
    it('is not paced, since the admin came back for one part of it', async () => {
      await act(async () => {
        render(<WithWorkflowRedesignOn />)
      })
      await act(async () => {
        useAdminWorkflowStore.getState().setToEditing(0)
      })
      await findOpenCard()

      expect(screen.getByText(FIELDS_LABEL)).toBeInTheDocument()
      expect(bandCount()).toBe(0)
      expect(
        screen.getByRole('button', { name: /save step/i }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', CONTINUE)).not.toBeInTheDocument()
    })
  })

  describe('with the redesign flag off', () => {
    it('opens a new step with every section at once and the usual Save row', async () => {
      await openNewStepCard(WithWorkflow)

      expect(bandCount()).toBe(0)
      expect(
        screen.getByRole('button', { name: /add step/i }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', CONTINUE)).not.toBeInTheDocument()
    })
  })
})

describe('what an unfinished step is allowed to save as', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  const WHAT_THEY_DO = { name: WHAT_THEY_DO_LABEL }
  const NO_RESPONDENT_TYPE = /please choose who fills in this step/i
  const NO_YES_NO_FIELD = /select a yes\/no field/i

  const reachDoneWithNothingChosen = async (
    Story: typeof WithWorkflowRedesignOn,
  ) => {
    const user = await openNewStepCard(Story)
    const advance = async () => {
      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })
    }

    await advance()
    await advance()

    await act(async () => {
      await user.click(screen.getByRole('checkbox', WHAT_THEY_DO))
    })
    expect(screen.getByRole('checkbox', WHAT_THEY_DO)).toBeChecked()
    await advance()

    expect(screen.getByText(FIELDS_LABEL)).toBeInTheDocument()
    await act(async () => {
      await user.click(screen.getByRole('button', DONE))
    })
  }

  it('keeps both prompts quiet while the form is closed', async () => {
    await reachDoneWithNothingChosen(NewStepOnPrivateFormRedesignOn)

    expect(screen.queryByText(NO_RESPONDENT_TYPE)).not.toBeInTheDocument()
    expect(screen.queryByText(NO_YES_NO_FIELD)).not.toBeInTheDocument()
  })

  it('still blocks on both once the form is public', async () => {
    await reachDoneWithNothingChosen(WithWorkflowRedesignOn)

    expect(await screen.findByText(NO_RESPONDENT_TYPE)).toBeInTheDocument()
    expect(screen.getByText(NO_YES_NO_FIELD)).toBeInTheDocument()
  })
})
