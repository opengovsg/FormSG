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
const fixtures = vi.hoisted(() => ({
  all: {
    data: { count: 25000, metadata: [] as { refNo: string }[] },
    isLoading: false,
    isFetching: false,
    isError: false,
    dataUpdatedAt: 1,
  },
  decrypt: {
    data: new Map(),
    isFetching: false,
    isError: false,
    dataUpdatedAt: 1,
  },
  search: {
    data: { count: 1, metadata: [] },
    isFetching: false,
    isError: false,
    dataUpdatedAt: 1,
  },
  submissionId: undefined as string | undefined,
  dateRange: [] as string[],
  newDecrypt: { isError: false },
}))

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: { _id: 'form-1', savedViews: [VIEW] } }),
}))
vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => true,
}))
vi.mock('~features/admin-form/responses/queries', () => ({
  useFormResponses: () => fixtures.search,
  useAllFormResponses: () => fixtures.all,
  useDecryptedResponsesBySubmissionId: () => fixtures.decrypt,
}))
vi.mock('~features/analytics/AnalyticsEventService', () => ({
  logAnalyticsEvent: vi.fn(),
}))
vi.mock('../StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({
    dateRange: fixtures.dateRange,
    setDateRange: mockSetDateRange,
  }),
}))
vi.mock('./hooks/useDecryptNewResponses', () => ({
  useDecryptNewResponses: () => fixtures.newDecrypt,
}))
vi.mock('./hooks/usePageSearchParams', () => ({
  usePageSearchParams: () => ({
    page: [undefined, vi.fn()],
    submissionId: [fixtures.submissionId, vi.fn()],
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

describe('response count readiness', () => {
  beforeEach(() => {
    fixtures.all.isLoading = false
    fixtures.all.isFetching = false
    fixtures.all.isError = false
    fixtures.decrypt.isFetching = false
    fixtures.decrypt.isError = false
    fixtures.newDecrypt.isError = false
    fixtures.search.isFetching = false
    fixtures.submissionId = undefined
    fixtures.dateRange = []
  })

  it('waits for newly fetched rows to decrypt before reporting a count', () => {
    fixtures.all.data.metadata = [{ refNo: 'new-response' }]
    const { result, rerender } = renderHook(() => useUnlockedResponses(), {
      wrapper: UnlockedResponsesProvider,
    })
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
    fixtures.decrypt.data = new Map([['new-response', []]])
    rerender()
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 25000,
    })
    fixtures.all.data.metadata = []
  })

  it('invalidates filtered counts on date/search/source changes and waits during cached refresh', () => {
    const { result, rerender } = renderHook(() => useUnlockedResponses(), {
      wrapper: UnlockedResponsesProvider,
    })
    act(() => result.current.setColumnOptions([{ id: 'a', label: 'A' }]))
    act(() => result.current.setColumnFilter('a', 'pending'))
    const report = () =>
      act(() =>
        result.current.reportMatchingCount({
          scope: result.current.responseCountScope,
          count: 5,
        }),
      )
    report()
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 5,
    })
    for (const change of [
      () => {
        fixtures.dateRange = ['2026-10-01', '2026-10-07']
      },
      () => {
        fixtures.submissionId = 'search'
      },
      () => {
        fixtures.all.dataUpdatedAt += 1
      },
      () => {
        fixtures.decrypt.data = new Map()
      },
    ]) {
      const oldScope = result.current.responseCountScope
      change()
      rerender()
      act(() =>
        result.current.reportMatchingCount({ scope: oldScope, count: 99 }),
      )
      expect(result.current.responseCountState).toEqual({ status: 'loading' })
      report()
    }
    fixtures.search.isFetching = true
    rerender()
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
    fixtures.search.isFetching = false
    rerender()
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
    report()
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 5,
    })
  })

  it.each([
    [10000, false],
    [10001, true],
  ])('retains the recent-only threshold at %i responses', (count, expected) => {
    const previous = fixtures.all.data.count
    fixtures.all.data.count = count as number
    expect(setupProvider().current.isShowingRecentOnly).toBe(expected)
    fixtures.all.data.count = previous
  })

  it('shows pending during a retry with retained failed data, then ready on success', () => {
    fixtures.all.isError = true
    fixtures.all.isFetching = true
    const { result, rerender } = renderHook(() => useUnlockedResponses(), {
      wrapper: UnlockedResponsesProvider,
    })
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
    fixtures.all.isFetching = false
    fixtures.all.isError = false
    rerender()
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 25000,
    })
  })

  it('preserves the server total above the loaded response limit', () => {
    const result = setupProvider()
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 25000,
    })
    expect(result.current.isShowingRecentOnly).toBe(true)
  })

  it.each(['metadata', 'decryption', 'initial'] as const)(
    'waits for %s loading even with cached data',
    (source) => {
      if (source === 'metadata') fixtures.all.isFetching = true
      if (source === 'decryption') fixtures.decrypt.isFetching = true
      if (source === 'initial') fixtures.all.isLoading = true
      expect(setupProvider().current.responseCountState).toEqual({
        status: 'loading',
      })
    },
  )

  it.each(['metadata', 'decryption', 'new decryption', 'search'] as const)(
    'shows unavailable for %s failure instead of retained data or zero',
    (source) => {
      if (source === 'metadata') fixtures.all.isError = true
      if (source === 'decryption') fixtures.decrypt.isError = true
      if (source === 'new decryption') fixtures.newDecrypt.isError = true
      if (source === 'search') {
        fixtures.submissionId = 'id'
        fixtures.search.isError = true
      }
      expect(setupProvider().current.responseCountState).toEqual({
        status: 'error',
      })
      fixtures.search.isError = false
    },
  )

  it('uses the successful search count', () => {
    fixtures.submissionId = 'id'
    expect(setupProvider().current.responseCountState).toEqual({
      status: 'ready',
      count: 1,
    })
  })

  it('waits for a filtered table report, accepts zero, and rejects the old scope after a filter changes', () => {
    const result = setupProvider()
    act(() => result.current.setColumnFilter('a', 'pending'))
    const oldScope = result.current.responseCountScope
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
    act(() => result.current.reportMatchingCount({ scope: oldScope, count: 0 }))
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 0,
    })
    act(() => result.current.setColumnFilter('a', 'approved'))
    act(() =>
      result.current.reportMatchingCount({ scope: oldScope, count: 12 }),
    )
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
    act(() =>
      result.current.reportMatchingCount({
        scope: result.current.responseCountScope,
        count: 125,
      }),
    )
    act(() => result.current.showMoreRows())
    expect(result.current.responseCountState).toEqual({
      status: 'ready',
      count: 125,
    })
  })

  it('does not reuse a filtered count after applying another saved view', () => {
    const result = setupProvider()
    act(() => result.current.setColumnFilter('a', 'approved'))
    act(() =>
      result.current.reportMatchingCount({
        scope: result.current.responseCountScope,
        count: 5,
      }),
    )
    act(() => result.current.applyView(VIEW._id))
    expect(result.current.responseCountState).toEqual({ status: 'loading' })
  })
})
