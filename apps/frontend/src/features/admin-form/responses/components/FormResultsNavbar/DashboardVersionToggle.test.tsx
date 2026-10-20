import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Language, ResultsEventType } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { DashboardVersionToggle } from './DashboardVersionToggle'

const FORM_ID = '0123456789abcdef01234567'

const mockLogResultsEvent = vi.fn()
const mockSetVersion = vi.fn()
let mockVersion: 'v1' | 'v2' = 'v2'

vi.mock('../../ResultsEventService', () => ({
  logResultsEvent: (...args: unknown[]) => mockLogResultsEvent(...args),
}))

vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => true,
}))

vi.mock('../../hooks/useIsDelightfulDashboard', () => ({
  useResultsDashboardVersion: () => [mockVersion, mockSetVersion],
}))

vi.mock('../../ResponsesPage/storage', () => ({
  useStorageResponsesContext: () => ({ secretKey: 'key' }),
}))

const renderToggle = (version: 'v1' | 'v2') => {
  mockVersion = version
  render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[`/admin/form/${FORM_ID}/results`]}>
        <Routes>
          <Route
            path="/admin/form/:formId/results"
            element={<DashboardVersionToggle />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  )
}

describe('DashboardVersionToggle results events', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))
  beforeEach(() => vi.clearAllMocks())

  it('logs switching from v2 back to v1', async () => {
    renderToggle('v2')

    await userEvent.setup().click(screen.getByRole('checkbox'))

    expect(mockLogResultsEvent).toHaveBeenCalledWith(FORM_ID, {
      type: ResultsEventType.VersionToggled,
      from: 'v2',
      to: 'v1',
    })
    expect(mockSetVersion).toHaveBeenCalledWith('v1')
  })

  it('logs switching from v1 to v2', async () => {
    renderToggle('v1')

    await userEvent.setup().click(screen.getByRole('checkbox'))

    expect(mockLogResultsEvent).toHaveBeenCalledWith(FORM_ID, {
      type: ResultsEventType.VersionToggled,
      from: 'v1',
      to: 'v2',
    })
  })
})
