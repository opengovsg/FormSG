import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { featureFlags } from 'formsg-shared/constants'
import { Language, SeenFlags } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'
import { MOCK_USER } from '~/mocks/msw/handlers/user'

import { theme } from '~theme/index'

import { useAdminWorkflowStore } from '../../adminWorkflowStore'
import { AdminEditWorkflowState } from '../../types'

import { WelcomeCard } from './WelcomeCard'

let flagWrites: unknown[] = []

const server = setupServer(
  http.get('/api/v3/user', () => HttpResponse.json(MOCK_USER)),
  http.post('/api/v3/user/flag/last-seen', async ({ request }) => {
    flagWrites.push(await request.json())
    return HttpResponse.json(MOCK_USER)
  }),
)

const renderCard = () =>
  render(
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={new QueryClient()}>
      <ChakraProvider theme={theme}>
        <GrowthBookProvider
          growthbook={
            new GrowthBook({
              features: {
                [featureFlags.workflowBuilderRedesign]: { defaultValue: true },
              },
            })
          }
        >
          <WelcomeCard />
        </GrowthBookProvider>
      </ChakraProvider>
    </QueryClientProvider>,
  )

describe('WelcomeCard', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' })
    return i18n.changeLanguage(Language.ENGLISH)
  })

  afterAll(() => server.close())

  afterEach(() => {
    server.resetHandlers()
    flagWrites = []
    useAdminWorkflowStore.getState().reset()
  })

  it('names step 1 as what the first person to open the link fills in', () => {
    renderCard()

    expect(screen.getByText("Let's start with Step 1")).toBeInTheDocument()
    expect(
      screen.getByText(/everyone who opens your form link fills in first/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/name it, choose who fills it in/i),
    ).toBeInTheDocument()
  })

  it('offers one action and no way out', () => {
    renderCard()

    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      "Let's go",
    ])
  })

  it('opens step 1 once the card has cleared', async () => {
    const user = userEvent.setup()
    renderCard()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /let's go/i }))
    })

    await waitFor(() =>
      expect(useAdminWorkflowStore.getState().createOrEditData).toEqual({
        state: AdminEditWorkflowState.CreatingStep,
      }),
    )
    expect(useAdminWorkflowStore.getState().isOnWelcomeCard).toBe(false)
  })

  it('records the admin as taught when they click through', async () => {
    const user = userEvent.setup()
    renderCard()

    expect(flagWrites).toEqual([])

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /let's go/i }))
    })

    await waitFor(() =>
      expect(flagWrites).toEqual([
        { flag: SeenFlags.GuidedWorkflowSetup, version: 1 },
      ]),
    )
  })

  it('records nothing from merely being shown', async () => {
    renderCard()
    await screen.findByText('Step 1')

    expect(flagWrites).toEqual([])
  })

  it('shows the form before turning it into a workflow', async () => {
    renderCard()

    expect(screen.getByAltText('FormSG')).toBeInTheDocument()
    await screen.findByText('Step 1')
  })
})
