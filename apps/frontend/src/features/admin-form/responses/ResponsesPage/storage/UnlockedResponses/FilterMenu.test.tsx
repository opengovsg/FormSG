import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DateString, Language } from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { FilterMenu } from './FilterMenu'

const mockClearColumnFilters = vi.fn()
const mockSetDateRange = vi.fn()
let mockColumnFilters: { columnId: string; text: string }[] = []
let mockDateRange: DateString[] = []

vi.mock('./UnlockedResponsesProvider', () => ({
  useUnlockedResponses: () => ({
    columnOptions: [{ id: 'name', label: 'Name' }],
    columnFilters: mockColumnFilters,
    setColumnFilter: vi.fn(),
    clearColumnFilters: mockClearColumnFilters,
  }),
}))

vi.mock('../StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({
    dateRange: mockDateRange,
    setDateRange: mockSetDateRange,
  }),
}))

const openFilterMenu = async () => {
  render(
    <ChakraProvider theme={theme}>
      <FilterMenu />
    </ChakraProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: /filter/i }))
  return screen.queryByRole('button', { name: 'Clear all filters' })
}

describe('the Filter menu', () => {
  beforeAll(() => i18n.changeLanguage(Language.ENGLISH))
  afterEach(() => {
    mockColumnFilters = []
    mockDateRange = []
    vi.clearAllMocks()
  })

  it('cannot clear filters when none are applied', async () => {
    expect(await openFilterMenu()).not.toBeInTheDocument()
  })

  it('clears column filters and the date range together', async () => {
    mockColumnFilters = [{ columnId: 'name', text: 'tan' }]
    mockDateRange = ['2026-10-06', '2026-10-08'] as DateString[]

    await userEvent.click((await openFilterMenu())!)

    expect(mockClearColumnFilters).toHaveBeenCalledTimes(1)
    expect(mockSetDateRange).toHaveBeenCalledWith([])
  })

  it('shows the action for a column filter on its own', async () => {
    mockColumnFilters = [{ columnId: 'name', text: 'tan' }]

    expect(await openFilterMenu()).toBeEnabled()
  })

  it('can clear a date range on its own', async () => {
    mockDateRange = ['2026-10-06', '2026-10-08'] as DateString[]

    expect(await openFilterMenu()).toBeEnabled()
  })
})
