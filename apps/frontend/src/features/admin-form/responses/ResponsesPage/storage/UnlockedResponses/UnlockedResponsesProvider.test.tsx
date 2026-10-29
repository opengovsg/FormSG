import { act, renderHook } from '@testing-library/react'

import {
  DateString,
  FormSavedView,
  SavedViewSortDirection,
} from 'formsg-shared/types'

import {
  ALL_RESPONSES_VIEW_ID,
  UnlockedResponsesProvider,
  useUnlockedResponses,
} from './UnlockedResponsesProvider'

const VIEW: FormSavedView = {
  _id: 'view-1',
  name: 'Pending',
  filter: {
    startDate: '2026-10-01' as DateString,
    endDate: '2026-10-07' as DateString,
    columnFilters: [{ columnId: 'a', text: 'pending' }],
  },
  sort: { columnId: 'a', direction: SavedViewSortDirection.Ascending },
  columnIds: ['a'],
}

const mockSetDateRange = vi.fn()

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: { _id: 'form-1', savedViews: [VIEW] } }),
}))
vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => true,
}))
vi.mock('~features/admin-form/responses/queries', () => ({
  useFormResponses: () => ({ data: undefined }),
  useAllFormResponses: () => ({ data: undefined, isLoading: false }),
  useDecryptedResponsesBySubmissionId: () => ({ isFetching: false }),
}))
vi.mock('~features/analytics/AnalyticsEventService', () => ({
  logAnalyticsEvent: vi.fn(),
}))
vi.mock('../StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({
    dateRange: [],
    setDateRange: mockSetDateRange,
  }),
}))
vi.mock('./hooks/useDecryptNewResponses', () => ({
  useDecryptNewResponses: () => undefined,
}))
vi.mock('./hooks/usePageSearchParams', () => ({
  usePageSearchParams: () => ({
    page: [undefined, vi.fn()],
    submissionId: [undefined, vi.fn()],
  }),
}))

const setupProvider = () => {
  const { result } = renderHook(() => useUnlockedResponses(), {
    wrapper: UnlockedResponsesProvider,
  })
  act(() =>
    result.current.setColumnOptions([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ]),
  )
  return result
}

describe('UnlockedResponsesProvider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('clears every filter, sort and hidden column on All responses', () => {
    const result = setupProvider()
    act(() => result.current.applyView(VIEW._id))
    act(() => result.current.setColumnFilter('b', 'extra'))

    act(() => result.current.applyView(ALL_RESPONSES_VIEW_ID))

    expect(result.current.selectedViewId).toBe(ALL_RESPONSES_VIEW_ID)
    expect(result.current.columnFilters).toEqual([])
    expect(result.current.hiddenColumnIds).toEqual([])
    expect(result.current.sortColumnId).toBeUndefined()
    expect(mockSetDateRange).toHaveBeenLastCalledWith([])
  })

  it('clears filters set on All responses when All responses is clicked again', () => {
    const result = setupProvider()
    act(() => result.current.setColumnFilter('a', 'approved'))

    act(() => result.current.applyView(ALL_RESPONSES_VIEW_ID))

    expect(result.current.columnFilters).toEqual([])
    expect(mockSetDateRange).toHaveBeenLastCalledWith([])
  })

  it('selects a view without changing the table', () => {
    const result = setupProvider()
    act(() => result.current.setColumnFilter('a', 'approved'))

    act(() => result.current.selectView(VIEW._id))

    expect(result.current.selectedViewId).toBe(VIEW._id)
    expect(result.current.columnFilters).toEqual([
      { columnId: 'a', text: 'approved' },
    ])
  })
})
