import { composeStories } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { SeenFlags } from 'formsg-shared/types'

import { MOCK_USER } from '~/mocks/msw/handlers/user'

import { useAdminWorkflowStore } from '../adminWorkflowStore'
import * as pageStories from '../CreatePageWorkflowTab.stories'
import { AdminEditWorkflowState } from '../types'

import { SPOTLIGHT_TEST_ID } from './Spotlight'

const { NoWorkflow, NoWorkflowRedesignOn } = composeStories(pageStories)

const NEW_HEADER = /workflows split your form into steps/i
const NEW_SUBHEADER = /send each step to a different person/i
const OLD_HEADER = /create a workflow to collect responses/i

const GUIDED = { name: /start with guided setup/i }
const MANUAL = { name: /set up manually/i }

const server = setupServer()

let servedUsers = 0

const withGuidedSetupFlag = (value: number | undefined) =>
  server.use(
    http.get('/api/v3/user', () => {
      servedUsers += 1
      return HttpResponse.json({
        ...MOCK_USER,
        flags:
          value === undefined ? {} : { [SeenFlags.GuidedWorkflowSetup]: value },
      })
    }),
  )

/**
 * The intro screen renders before /api/v3/user resolves, but the fork reads the
 * admin's seen-flag at click time. Without waiting, a click can beat the query
 * and an admin who has been taught is treated as one who has not.
 */
const settleUser = async () => {
  await waitFor(() => expect(servedUsers).toBeGreaterThan(0))
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

let localStore: Record<string, string> = {}

describe('the workflow tab intro screen', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' })
    Element.prototype.scrollIntoView = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStore[key] ?? null,
      setItem: (key: string, value: string) => {
        localStore[key] = value
      },
      removeItem: (key: string) => {
        delete localStore[key]
      },
      clear: () => {
        localStore = {}
      },
    })
  })

  afterAll(() => server.close())

  afterAll(() => {
    vi.unstubAllGlobals()
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  beforeEach(() => {
    localStore = {}
    servedUsers = 0
    // Serve an admin with no flags by default, so every test resolves the user
    // query rather than relying on it failing.
    withGuidedSetupFlag(undefined)
  })

  afterEach(() => {
    server.resetHandlers()
    useAdminWorkflowStore.getState().reset()
  })

  describe('with the redesign flag on', () => {
    const renderIntro = async () => {
      await act(async () => {
        render(<NoWorkflowRedesignOn />)
      })
      await screen.findByText(NEW_HEADER, {}, { timeout: 10000 })
      await settleUser()
    }

    it('says what a workflow does, and offers both ways in', async () => {
      await renderIntro()

      expect(screen.getByText(NEW_SUBHEADER)).toBeInTheDocument()
      expect(screen.getByRole('button', GUIDED)).toBeInTheDocument()
      expect(screen.getByRole('button', MANUAL)).toBeInTheDocument()
    })

    it('drops the heading that named the feature and the guide link', async () => {
      await renderIntro()

      expect(screen.queryByText(OLD_HEADER)).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: /learn how to create a workflow/i }),
      ).not.toBeInTheDocument()
    })

    it('illustrates a form rather than borrowing the real title', async () => {
      await renderIntro()

      expect(screen.getByText('My form')).toBeInTheDocument()
    })

    it('shows the logo a real form falls back to', async () => {
      await renderIntro()

      expect(screen.getByAltText('FormSG')).toBeInTheDocument()
    })

    describe('the fork', () => {
      it('skips the card for an admin who has been taught', async () => {
        const user = userEvent.setup()
        withGuidedSetupFlag(1)
        await renderIntro()

        await act(async () => {
          await user.click(screen.getByRole('button', GUIDED))
        })

        expect(
          screen.queryByText(/let's start with step 1/i),
        ).not.toBeInTheDocument()
        await waitFor(() =>
          expect(screen.getAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(1),
        )
      })

      it('still shows the card to an admin seeded as pre-existing', async () => {
        const user = userEvent.setup()
        withGuidedSetupFlag(0)
        await renderIntro()

        await act(async () => {
          await user.click(screen.getByRole('button', GUIDED))
        })

        expect(screen.getByText(/let's start with step 1/i)).toBeInTheDocument()
      })

      it('orients on the welcome card before asking for anything', async () => {
        const user = userEvent.setup()
        await renderIntro()

        await act(async () => {
          await user.click(screen.getByRole('button', GUIDED))
        })

        expect(useAdminWorkflowStore.getState().isGuidedSetup).toBe(true)
        expect(screen.getByText(/let's start with step 1/i)).toBeInTheDocument()
        expect(useAdminWorkflowStore.getState().createOrEditData).toBeNull()
      })

      it('paces the step one decision at a time after the welcome card', async () => {
        const user = userEvent.setup()
        await renderIntro()

        await act(async () => {
          await user.click(screen.getByRole('button', GUIDED))
        })
        await act(async () => {
          await user.click(screen.getByRole('button', { name: /let's go/i }))
        })
        await waitFor(() =>
          expect(screen.getAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(1),
        )

        expect(
          screen.getByRole('button', { name: /^continue$/i }),
        ).toBeInTheDocument()
      })

      it('opens every section at once from manual setup', async () => {
        const user = userEvent.setup()
        await renderIntro()

        await act(async () => {
          await user.click(screen.getByRole('button', MANUAL))
        })

        expect(useAdminWorkflowStore.getState().isGuidedSetup).toBe(false)
        expect(screen.queryAllByTestId(SPOTLIGHT_TEST_ID)).toHaveLength(0)
        expect(
          screen.queryByRole('button', { name: /^continue$/i }),
        ).not.toBeInTheDocument()
      })

      it('leaves manual setup without completion reports', async () => {
        const user = userEvent.setup()
        await renderIntro()

        await act(async () => {
          await user.click(screen.getByRole('button', MANUAL))
        })
        await act(async () => {
          useAdminWorkflowStore.getState().setCompletedStep(0)
          useAdminWorkflowStore.getState().setToInactive()
        })

        expect(
          screen.queryByText(/step 1 is the public-facing step/i),
        ).not.toBeInTheDocument()
      })
    })

    it('starts a step straight away from manual setup', async () => {
      const user = userEvent.setup()
      await renderIntro()

      await act(async () => {
        await user.click(screen.getByRole('button', MANUAL))
      })

      expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
        state: AdminEditWorkflowState.CreatingStep,
      })
    })
  })

  describe('with the redesign flag off', () => {
    it('keeps the pre-redesign screen whole', async () => {
      await act(async () => {
        render(<NoWorkflow />)
      })

      expect(
        await screen.findByText(OLD_HEADER, {}, { timeout: 10000 }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: /learn how to create a workflow/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /create workflow/i }),
      ).toBeInTheDocument()
      expect(screen.queryByText(NEW_HEADER)).not.toBeInTheDocument()
    })
  })
})
