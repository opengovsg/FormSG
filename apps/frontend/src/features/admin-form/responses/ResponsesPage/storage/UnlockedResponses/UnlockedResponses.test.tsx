import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'

import { Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { UnlockedResponses } from './UnlockedResponses'
import type { ResponseCountState } from './UnlockedResponsesProvider'

let countState: ResponseCountState = { status: 'ready', count: 105 }
let recentOnly = false
let hasActiveFilters = false
vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => true,
}))
vi.mock('../../../components/FormResultsNavbar', () => ({
  DashboardVersionToggle: () => null,
  useResultsNavLayout: () => ({ contentPr: '1rem' }),
}))
vi.mock('./UnlockedResponsesProvider', () => ({
  ALL_RESPONSES_VIEW_ID: 'all-responses',
  useUnlockedResponses: () => ({
    responseCountState: countState,
    savedViews: [],
    selectedViewId: 'all-responses',
    isShowingRecentOnly: recentOnly,
    hasActiveFilters,
    applyView: vi.fn(),
  }),
}))
vi.mock('./useSavedViewMutation', () => ({
  useDeleteSavedViewMutation: () => ({ mutate: vi.fn() }),
}))
vi.mock('./ResponsesTable', () => ({ ResponsesTable: () => null }))
vi.mock('./ResponsesToolbar', () => ({ ResponsesToolbar: () => null }))
vi.mock('./ShowMoreRowsButton', () => ({ ShowMoreRowsButton: () => null }))
vi.mock('./DeleteViewModal', () => ({ DeleteViewModal: () => null }))

const view = () => (
  <ChakraProvider theme={theme}>
    <UnlockedResponses />
  </ChakraProvider>
)

describe('response count placement', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))
  beforeEach(() => {
    recentOnly = false
    hasActiveFilters = false
    countState = { status: 'ready', count: 105 }
  })

  it('places the count beside the active label and removes the separate heading', () => {
    render(view())
    expect(
      screen.getByRole('button', { name: 'All responses (105)' }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/responses to date/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/most recent/i)).not.toBeInTheDocument()
  })

  it.each([false, true])(
    'keeps the recent-only explanation visible with filters %s',
    (filtered) => {
      recentOnly = true
      hasActiveFilters = filtered
      render(view())
      expect(
        screen.getByText(
          filtered
            ? 'Only applying filters and sorting to the most recent 10,000 responses'
            : 'Only showing the most recent 10,000 responses',
        ),
      ).toBeVisible()
    },
  )

  it('shows a no-match message only for successful empty filtered results', () => {
    hasActiveFilters = true
    countState = { status: 'ready', count: 0 }
    const { rerender } = render(view())
    expect(
      screen.getByText('No responses match your search or filters.'),
    ).toBeVisible()
    countState = { status: 'error' }
    rerender(view())
    expect(
      screen.queryByText('No responses match your search or filters.'),
    ).not.toBeInTheDocument()
  })

  it('replaces a previous count with loading, then successful zero or unavailable', () => {
    const { rerender } = render(view())
    countState = { status: 'loading' }
    rerender(view())
    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading response count',
    )
    expect(screen.queryByText('(105)')).not.toBeInTheDocument()
    countState = { status: 'ready', count: 0 }
    rerender(view())
    expect(
      screen.getByRole('button', { name: 'All responses (0)' }),
    ).toBeInTheDocument()
    countState = { status: 'error' }
    rerender(view())
    expect(
      screen.getByRole('button', { name: 'All responses (Count unavailable)' }),
    ).toBeInTheDocument()
  })
})
