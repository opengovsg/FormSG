import { composeStories } from '@storybook/react-vite'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as SettingsService from '~features/admin-form/settings/SettingsService'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'
import * as pageStories from '../../../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState } from '../../../types'
import { SPOTLIGHT_TEST_ID } from '../../Spotlight'

import * as editorStories from './EditStepBlock.stories'

const {
  NoWorkflow,
  WithWorkflow,
  NewStepOnPrivateForm,
  StepLoginMixedProviders,
} = composeStories(pageStories)

const { GuidedFirstStepLogin, GuidedLaterStepLogin } =
  composeStories(editorStories)

const STEP_NAME_LABEL = /step name/i
const PEOPLE_LABEL = /who should fill in this step/i
const WHAT_THEY_DO_LABEL = /make this person approve/i
const FIELDS_LABEL = /choose the fields this person fills in/i

const CONTINUE = { name: /^continue$/i }
const BACK = { name: /^back$/i }
const CANCEL = { name: /^cancel$/i }
const DONE = { name: /^(save|add) step$/i }

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

    it('offers Save step rather than Continue once the last decision is on screen', async () => {
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

    it('hides the later stacked decision when going Back with the flag off', async () => {
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

    it('keeps the original stacked Approvals then Fields flow when the login flag is off', async () => {
      const user = await openNewStepCard(NewStepOnPrivateForm)
      await user.click(screen.getByRole('button', CONTINUE))
      await user.click(screen.getByRole('button', CONTINUE))
      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      expect(screen.getByText(WHAT_THEY_DO_LABEL)).toBeVisible()
      expect(screen.queryByText(FIELDS_LABEL)).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', CONTINUE))
      expect(screen.getByText(FIELDS_LABEL)).toBeVisible()
      await user.click(screen.getByRole('button', BACK))
      expect(screen.queryByText(FIELDS_LABEL)).not.toBeInTheDocument()
      await act(async () =>
        useAdminWorkflowStore.getState().setGuidedSetup(false),
      )
      expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      expect(screen.getByText(WHAT_THEY_DO_LABEL)).toBeVisible()
      expect(screen.getByText(FIELDS_LABEL)).toBeVisible()
      await act(async () =>
        useAdminWorkflowStore.getState().setGuidedSetup(true),
      )
    })

    it('asks what they do, which step 1 has no section for', async () => {
      const user = await openNewStepCard(NewStepOnPrivateForm)

      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })
      await act(async () => {
        await user.click(screen.getByRole('button', CONTINUE))
      })

      expect(screen.getByText(WHAT_THEY_DO_LABEL)).toBeVisible()
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
    expect(screen.getByText(FIELDS_LABEL)).toBeVisible()
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
    const user = await openNewStepCard(WithWorkflow)
    await user.click(screen.getByRole('button', CONTINUE))
    await user.click(screen.getByRole('button', CONTINUE))
    expect(await screen.findByText(NO_RESPONDENT_TYPE)).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', DONE)).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Specific emails/i }))
    await user.type(
      screen.getByPlaceholderText('me@example.com'),
      'reviewer@example.gov.sg{Enter}',
    )
    await user.click(screen.getByRole('button', CONTINUE))
    await user.click(screen.getByRole('checkbox', WHAT_THEY_DO))
    await user.click(screen.getByRole('button', CONTINUE))
    expect(await screen.findByText(NO_YES_NO_FIELD)).toBeVisible()
    expect(screen.queryByText(FIELDS_LABEL)).not.toBeInTheDocument()
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

describe('guided Login tabs', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })
  afterEach(() => {
    useAdminWorkflowStore.getState().reset()
    useAdminWorkflowStore.getState().setGuidedSetup(true)
  })

  const reachLogin = async () => {
    const user = await openNewStepCard(StepLoginMixedProviders)
    await user.click(screen.getByRole('button', CONTINUE))
    await user.click(screen.getByRole('button', CONTINUE))
    expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    return user
  }

  it('moves the spotlight back to Login when its selected tab is clicked after Back', async () => {
    const user = await reachLogin()
    await user.click(screen.getByRole('button', BACK))
    expect(
      screen.getByText(/choose who formsg sends the form to/i),
    ).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Login' }))
    expect(
      screen.queryByText(/choose who formsg sends the form to/i),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', CONTINUE))
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('announces locked tabs by keyboard without activating them', async () => {
    const user = await reachLogin()
    const login = screen.getByRole('tab', { name: 'Login' })
    const fields = screen.getByRole('tab', { name: 'Fields to fill' })
    login.focus()
    await user.keyboard('{ArrowRight}')
    expect(fields).toHaveFocus()
    expect(fields).toHaveAttribute('aria-disabled', 'true')
    await user.keyboard('{Enter} ')
    expect(login).toHaveAttribute('aria-selected', 'true')
    expect(fields).toHaveAttribute('aria-selected', 'false')
    await user.click(fields)
    expect(login).toHaveAttribute('aria-selected', 'true')
  })

  it('unlocks tabs in order and keeps reached tabs available after Back', async () => {
    const user = await reachLogin()
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Approvals' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await user.click(screen.getByRole('radio', { name: /^Corppass/ }))
    expect(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
    ).toHaveValue('')
    await user.click(screen.getByRole('button', CONTINUE))
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(screen.getByRole('button', CONTINUE))
    expect(screen.getByRole('tab', { name: 'Approvals' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(screen.getByRole('button', BACK))
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Approvals' })).toBeEnabled()
    await user.click(screen.getByRole('tab', { name: 'Login' }))
    expect(screen.getByRole('radio', { name: /^Corppass/ })).toBeChecked()
  })

  it('blocks malformed IDs on Continue and focuses Login errors discovered at Save', async () => {
    const user = await reachLogin()
    await user.click(screen.getByRole('radio', { name: /^Corppass/ }))
    const id = screen.getByRole('textbox', { name: /Corppass e-service ID/i })
    await user.type(id, 'invalid id')
    await user.click(screen.getByRole('button', CONTINUE))
    expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await user.clear(id)
    await user.click(screen.getByRole('button', CONTINUE))
    await user.click(screen.getByRole('button', CONTINUE))
    await user.click(screen.getByRole('tab', { name: 'Login' }))
    await user.type(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
      'invalid id',
    )
    await user.click(screen.getByRole('tab', { name: 'Approvals' }))
    await user.click(screen.getByRole('button', DONE))
    expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
      ).toHaveFocus(),
    )
    expect(screen.getByRole('tab', { name: 'Approvals' })).toBeEnabled()
  })

  it('keeps reached name and respondent answers editable above the tabs', async () => {
    const user = await reachLogin()
    const name = screen.getByRole('textbox', { name: /step name/i })
    await user.type(name, 'New reviewer')
    await user.click(screen.getByRole('radio', { name: /Specific emails/i }))
    await user.type(
      screen.getByPlaceholderText('me@example.com'),
      'reviewer@example.gov.sg{Enter}',
    )
    await user.click(screen.getByRole('button', CONTINUE))
    expect(name).toHaveValue('New reviewer')
    expect(screen.getByText('reviewer@example.gov.sg')).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('routes a server recipient error to the people spotlight and focuses its input', async () => {
    const submit = vi.fn(async () => {
      throw new Error('"emails[0]" must be a valid email')
    })
    render(<GuidedLaterStepLogin onSubmit={submit} />)
    const user = userEvent.setup()
    await screen.findByRole('textbox', { name: /step name/i })
    await user.click(screen.getByRole('button', CONTINUE))
    await user.click(screen.getByRole('radio', { name: /Specific emails/i }))
    expect(screen.getByPlaceholderText('me@example.com')).toBeVisible()
    for (let index = 0; index < 3; index++) {
      await user.click(screen.getByRole('button', CONTINUE))
    }
    await user.click(screen.getByRole('button', DONE))
    expect(submit).toHaveBeenCalled()
    expect(
      await screen.findByText(/enter valid emails separated by commas/i),
    ).toBeVisible()
    expect(
      screen.getByText(/choose who formsg sends the form to/i),
    ).toBeVisible()
    await waitFor(() =>
      expect(screen.getByPlaceholderText('me@example.com')).toHaveFocus(),
    )
    expect(screen.getByRole('tab', { name: 'Approvals' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('preserves answers and resumes the guided position after toggling guidance', async () => {
    const user = await reachLogin()
    await user.click(screen.getByRole('radio', { name: /^Corppass/ }))
    await user.type(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
      'agency-id',
    )
    await user.click(screen.getByRole('button', CONTINUE))
    await act(async () =>
      useAdminWorkflowStore.getState().setGuidedSetup(false),
    )
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Approvals' })).toBeEnabled()
    await user.click(screen.getByRole('tab', { name: 'Login' }))
    expect(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
    ).toHaveValue('agency-id')
    await act(async () => useAdminWorkflowStore.getState().setGuidedSetup(true))
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Approvals' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await user.click(screen.getByRole('tab', { name: 'Login' }))
    expect(screen.getByRole('radio', { name: /^Corppass/ })).toBeChecked()
    expect(
      screen.getByRole('textbox', { name: /Corppass e-service ID/i }),
    ).toHaveValue('agency-id')
  })
})

describe('guided first-step restriction save failures', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterAll(() => {
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })
  afterEach(() => useAdminWorkflowStore.getState().reset())

  it('focuses the error on Login when saving first-step restrictions fails', async () => {
    const updateRestrictions = vi
      .spyOn(SettingsService, 'updateIsSingleSubmission')
      .mockRejectedValueOnce(new Error('Restrictions unavailable'))
    render(
      <GuidedFirstStepLogin
        onSubmit={async (_inputs, afterSave) => {
          await afterSave?.()
        }}
      />,
    )
    const user = userEvent.setup()
    await screen.findByRole('textbox', { name: /step name/i })
    const next = () => user.click(screen.getByRole('button', CONTINUE))
    await next()
    await next()
    expect(
      screen.queryByRole('tab', { name: 'Approvals' }),
    ).not.toBeInTheDocument()
    await user.click(
      await screen.findByRole('checkbox', { name: /limit each unique/i }),
    )
    await next()
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(screen.getByRole('button', DONE))
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Login' })).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    )
    expect(screen.getByRole('tab', { name: 'Fields to fill' })).toBeEnabled()
    expect(
      await screen.findByText(/step was saved.*Step 1 restrictions/i),
    ).toBeInTheDocument()
    expect(updateRestrictions).toHaveBeenCalledWith('12345', true)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus())
    updateRestrictions.mockRestore()
  })
})
