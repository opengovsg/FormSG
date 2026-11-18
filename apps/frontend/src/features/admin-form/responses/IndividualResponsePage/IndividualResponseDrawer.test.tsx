import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { fireEvent, screen, within } from '@testing-library/react'

import { render } from '~/test-utils'

import { IndividualResponseDrawer } from './IndividualResponseDrawer'

const mockUseUnlockedResponses = vi.fn()
const mockProvider = (overrides: Record<string, unknown> = {}) =>
  mockUseUnlockedResponses.mockReturnValue({
    getAdjacentSubmissions: () => ({}),
    onNavigateToSubmission: vi.fn(),
    ...overrides,
  })

vi.mock(
  '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider',
  () => ({
    useUnlockedResponses: () => mockUseUnlockedResponses(),
  }),
)

const mockUseStorageResponsesContext = vi.fn(() => ({ secretKey: 'secret' }))

vi.mock('../ResponsesPage/storage', () => ({
  useStorageResponsesContext: () => mockUseStorageResponsesContext(),
}))

vi.mock('./IndividualResponsePage', () => ({
  IndividualResponsePage: () => <div>response body</div>,
}))

vi.mock('./IndividualResponseTitle', () => ({
  IndividualResponseTitle: () => <h2>response title</h2>,
}))

const RESULTS_PATH = '/admin/form/mock-form-id/results'

const LocationDisplay = () => {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{`${pathname}${search}`}</div>
}

const renderDrawer = () =>
  render(
    <MemoryRouter initialEntries={[`${RESULTS_PATH}/mock-submission-id`]}>
      <Routes>
        <Route path="/admin/form/:formId/results">
          <Route index element={<LocationDisplay />} />
          <Route
            path=":submissionId"
            element={
              <>
                <IndividualResponseDrawer />
                <LocationDisplay />
              </>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

const closeDrawer = () =>
  fireEvent.click(screen.getByRole('button', { name: /close/i }))

describe('IndividualResponseDrawer', () => {
  it('returns to the table page the response was opened from', async () => {
    mockProvider({ lastNavPage: 2 })

    const { container } = renderDrawer()
    closeDrawer()

    expect(await within(container).findByTestId('location')).toHaveTextContent(
      `${RESULTS_PATH}?page=2`,
    )
  })

  it('omits the page param when the response was opened from page 1', async () => {
    mockProvider({ lastNavPage: 1 })

    const { container } = renderDrawer()
    closeDrawer()

    const location = await within(container).findByTestId('location')
    expect(location.textContent).toBe(RESULTS_PATH)
  })

  it('keeps the submission search the response was opened from', async () => {
    mockProvider({
      lastNavPage: 3,
      lastNavSubmissionId: 'searched-id',
    })

    const { container } = renderDrawer()
    closeDrawer()

    expect(await within(container).findByTestId('location')).toHaveTextContent(
      `${RESULTS_PATH}?page=3&submissionId=searched-id`,
    )
  })

  it('returns to the unfiltered table after a direct link', async () => {
    mockProvider({})

    const { container } = renderDrawer()
    closeDrawer()

    const location = await within(container).findByTestId('location')
    expect(location.textContent).toBe(RESULTS_PATH)
  })

  it('steps to the neighbouring responses from the header arrows', async () => {
    const onNavigateToSubmission = vi.fn()
    mockProvider({
      getAdjacentSubmissions: () => ({
        previous: { refNo: 'prev-id', number: 8 },
        next: { refNo: 'next-id', number: 6 },
      }),
      onNavigateToSubmission,
    })

    const { container } = renderDrawer()
    fireEvent.click(screen.getByRole('button', { name: /next response/i }))

    expect(await within(container).findByTestId('location')).toHaveTextContent(
      `${RESULTS_PATH}/next-id`,
    )
    expect(onNavigateToSubmission).toHaveBeenCalledWith('next-id')
  })

  it('stays closed while responses are locked', () => {
    mockProvider()
    mockUseStorageResponsesContext.mockReturnValueOnce({ secretKey: '' })

    renderDrawer()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
