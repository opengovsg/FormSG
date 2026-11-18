import { composeStories } from '@storybook/react-vite'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState } from '../../../types'
import { SPOTLIGHT_TEST_ID } from '../../Spotlight'

const {
  NoWorkflow,
  WithWorkflow,
  NewStepOnPrivateForm,
  StepLoginMixedProviders,
} = composeStories(pageStories)

const STEP_NAME_LABEL = /step name/i
const PEOPLE_LABEL = /who should fill in this step/i
const WHAT_THEY_DO_LABEL = /make this person approve/i
const FIELDS_LABEL = /choose the fields this person fills in/i

const CONTINUE = { name: /^continue$/i }
const BACK = { name: /^back$/i }
const CANCEL = { name: /^cancel$/i }
const DONE = { name: /^done$/i }

const bandCount = () => screen.queryAllByTestId(SPOTLIGHT_TEST_ID).length

const findOpenCard = () =>
  screen.findByText(STEP_NAME_LABEL, {}, { timeout: 10000 })

const openNewStepCard = async (Story: typeof NoWorkflow) => {
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
      await openNewStepCard(NoWorkflow)

      expect(screen.getByText(STEP_NAME_LABEL)).toBeInTheDocument()
      expect(screen.queryByText(PEOPLE_LABEL)).not.toBeInTheDocument()
      expect(bandCount()).toBe(1)

      expect(screen.getByRole('button', CONTINUE)).toBeInTheDocument()
      expect(screen.queryByRole('button', BACK)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', CANCEL)).not.toBeInTheDocument()
    })

    it('reveals the next decision on Continue, and offers Back once there is one', async () => {
      const user = await openNewStepCard(NoWorkflow)

      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })

      expect(screen.getByText(PEOPLE_LABEL)).toBeInTheDocument()
      expect(bandCount()).toBe(2)
      expect(screen.getByRole('button', BACK)).toBeInTheDocument()
    })

    it('offers Done rather than Continue once the last decision is on screen', async () => {
      const user = await openNewStepCard(NoWorkflow)

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
      const user = await openNewStepCard(NoWorkflow)

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
      await openNewStepCard(WithWorkflow)

      expect(bandCount()).toBe(1)
      expect(screen.getByRole('button', CONTINUE)).toBeInTheDocument()
      expect(screen.getByRole('button', CANCEL)).toBeInTheDocument()
    })

    it('asks what they do, which step 1 has no section for', async () => {
      const user = await openNewStepCard(WithWorkflow)

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
        render(<WithWorkflow />)
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

  const reachDoneWithNothingChosen = async (Story: typeof WithWorkflow) => {
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
    await reachDoneWithNothingChosen(NewStepOnPrivateForm)

    expect(screen.queryByText(NO_RESPONDENT_TYPE)).not.toBeInTheDocument()
    expect(screen.queryByText(NO_YES_NO_FIELD)).not.toBeInTheDocument()
  })

  it('still blocks on both once the form is public', async () => {
    await reachDoneWithNothingChosen(WithWorkflow)

    expect(await screen.findByText(NO_RESPONDENT_TYPE)).toBeInTheDocument()
    expect(screen.getByText(NO_YES_NO_FIELD)).toBeInTheDocument()
  })
})

describe('a guided step card that has not reached its last section', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  afterEach(() => useAdminWorkflowStore.getState().reset())

  it('stays put when another step is clicked, rather than saving a half step', async () => {
    await openNewStepCard(WithWorkflow)

    await act(async () => {
      useAdminWorkflowStore.getState().requestSwitchTo(0)
    })

    expect(useAdminWorkflowStore.getState().pendingSwitchTo).toBeNull()
    expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
      state: AdminEditWorkflowState.CreatingStep,
    })
    expect(await findOpenCard()).toBeInTheDocument()
  })
})

describe('step login tabs', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })
  afterEach(() => useAdminWorkflowStore.getState().reset())
  it('shows only Login and Fields to fill for the first step', async () => {
    await act(async () => {
      render(<StepLoginMixedProviders />)
    })
    await act(async () => {
      useAdminWorkflowStore.getState().setToEditing(0)
    })
    await findOpenCard()
    expect(
      (await screen.findAllByRole('tab')).map((tab) => tab.textContent),
    ).toEqual(['Login', 'Fields to fill'])
    expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Fields to fill' }))
    expect(
      screen.getByRole('tabpanel', { name: 'Fields to fill' }),
    ).toBeVisible()
  })
  it('opens on Login and preserves the saved provider when editing a later step', async () => {
    await act(async () => {
      render(<StepLoginMixedProviders />)
    })
    await act(async () => {
      useAdminWorkflowStore.getState().setToEditing(1)
    })
    await findOpenCard()
    const tabs = await screen.findAllByRole('tab')
    expect(tabs[0]).toHaveTextContent('Login')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('radio', { name: /^Corppass/ })).toBeChecked()
    await userEvent.click(screen.getByRole('tab', { name: 'Approvals' }))
    expect(
      screen.getByRole('checkbox', { name: /make this person approve/i }),
    ).toBeChecked()
    await userEvent.click(screen.getByRole('tab', { name: 'Login' }))
    await userEvent.type(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
      'invalid id',
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Fields to fill' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save step' }))
    expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
    ).toHaveValue('invalid id')
  })
})
