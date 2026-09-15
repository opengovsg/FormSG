import { composeStories } from '@storybook/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GUIDED_WORKFLOW_MODE_KEY_PREFIX } from '~constants/localStorage'

import {
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import * as pageStories from '../CreatePageWorkflowTab.stories'

const MOCK_USER_ID = 'mock-admin-id'
const currentUserId = { value: MOCK_USER_ID }
vi.mock('~features/user/queries', () => ({
  useUser: () => ({
    user: { _id: currentUserId.value, flags: {} },
    isLoading: false,
  }),
}))

const { WithWorkflowRedesignOn } = composeStories(pageStories)

const SWITCH = { name: /guided setup/i }
const CONFIRM = { name: /^skip guidance$/i }

let store: Record<string, string> = {}

const isGuided = () => isGuidedSetupSelector(useAdminWorkflowStore.getState())

const guidedModeKeys = () =>
  Object.keys(store).filter((key) =>
    key.startsWith(GUIDED_WORKFLOW_MODE_KEY_PREFIX),
  )

const openTab = async () => {
  await act(async () => {
    render(<WithWorkflowRedesignOn />)
  })
  await screen.findByRole('heading', { name: /^workflow$/i }, { timeout: 8000 })
  return userEvent.setup()
}

const turnGuidedOff = async (ui: Awaited<ReturnType<typeof openTab>>) => {
  await ui.click(screen.getByRole('checkbox', SWITCH))
  await ui.click(await screen.findByRole('button', CONFIRM))
}

describe('remembering the guided mode choice', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    })
  })

  afterAll(() => {
    vi.unstubAllGlobals()
    delete (Element.prototype as Partial<Pick<Element, 'scrollIntoView'>>)
      .scrollIntoView
  })

  beforeEach(() => {
    store = {}
    currentUserId.value = MOCK_USER_ID
    useAdminWorkflowStore.getState().reset()
    useAdminWorkflowStore.getState().setGuidedSetup(true)
  })

  it('writes the choice to local storage, keyed for this admin', async () => {
    const ui = await openTab()
    await turnGuidedOff(ui)

    await waitFor(() =>
      expect(store[`${GUIDED_WORKFLOW_MODE_KEY_PREFIX}${MOCK_USER_ID}`]).toBe(
        'false',
      ),
    )
  })

  it('reopens on the stored choice once the store is back to its default', async () => {
    const ui = await openTab()
    await turnGuidedOff(ui)
    await waitFor(() => expect(guidedModeKeys()).toHaveLength(1))

    act(() => {
      useAdminWorkflowStore.getState().reset()
      useAdminWorkflowStore.getState().setGuidedSetup(true)
    })
    await openTab()

    await waitFor(() => expect(isGuided()).toBe(false))
  })

  it('gives the guided default to a second admin in the same tab', async () => {
    const ui = await openTab()
    await turnGuidedOff(ui)
    await waitFor(() => expect(isGuided()).toBe(false))

    currentUserId.value = 'another-admin-id'
    await openTab()

    await waitFor(() => expect(isGuided()).toBe(true))
  })
})
