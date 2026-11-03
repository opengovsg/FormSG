import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DateString,
  Language,
  SavedViewColumnFilter,
} from 'formsg-shared/types'

import i18n from '~/i18n/i18n'

import { theme } from '~theme/index'

import { FilterMenu } from './FilterMenu'

const mockClearColumnFilters = vi.fn()
const mockSetColumnFilter = vi.fn()
const mockSetDateRange = vi.fn()
let mockColumnFilters: SavedViewColumnFilter[] = []
let mockDateRange: DateString[] = []

vi.mock('./UnlockedResponsesProvider', () => ({
  useUnlockedResponses: () => ({
    columnOptions: [
      { id: 'name', label: 'Name' },
      {
        id: 'status',
        label: 'Status',
        filterValues: ['Pending', 'Approved'],
      },
    ],
    columnFilters: mockColumnFilters,
    setColumnFilter: mockSetColumnFilter,
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
  await screen.findByRole('menu')
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

  it('filters a column with a fixed set of values by checking them', async () => {
    await openFilterMenu()

    await userEvent.click(screen.getByRole('button', { name: /status/i }))
    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'Pending' }),
    )

    expect(mockSetColumnFilter).toHaveBeenLastCalledWith('status', ['Approved'])
  })

  it('shows the action for a values filter on its own', async () => {
    mockColumnFilters = [{ columnId: 'status', values: ['Approved'] }]

    expect(await openFilterMenu()).toBeEnabled()
  })

  it('can clear a date range on its own', async () => {
    mockDateRange = ['2026-10-06', '2026-10-08'] as DateString[]

    expect(await openFilterMenu()).toBeEnabled()
  })
})
