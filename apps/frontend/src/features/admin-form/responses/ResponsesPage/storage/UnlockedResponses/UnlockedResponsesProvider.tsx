import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AnalyticsEventType,
  DateString,
  FormSavedView,
  SavedViewColumnFilter,
  SavedViewSortDirection,
  SubmissionMetadata,
} from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'
import {
  useAllFormResponses,
  useDecryptedResponsesBySubmissionId,
  useFormResponses,
} from '~features/admin-form/responses/queries'
import { logAnalyticsEvent } from '~features/analytics/AnalyticsEventService'

import { TABLE_ROW_RENDER_CHUNK } from '../../../constants'
import { useStorageResponsesContext } from '../StorageResponsesContext'

import { useDecryptNewResponses } from './hooks/useDecryptNewResponses'
import { usePageSearchParams } from './hooks/usePageSearchParams'
import { renderLimitToInclude } from './renderLimit'
import { exceedsTableLimit } from './responseLimit'
import {
  fromSavedView,
  hasActiveViewState,
  ResponsesViewState,
  withColumnFilter,
} from './savedViews'

export const ALL_RESPONSES_VIEW_ID = 'all-responses'

const EMPTY_VIEW_STATE: ResponsesViewState = {
  dateRange: [] as DateString[],
  columnFilters: [],
  hiddenColumnIds: [],
  sortColumnId: undefined,
  sortDirection: SavedViewSortDirection.Descending,
}

export type ResponseSortDirection = SavedViewSortDirection

export interface ResponseColumnOption {
  id: string
  label: string
}

interface UnlockedResponsesContextProps {
  currentPage?: number
  setCurrentPage: (page: number) => void
  submissionId?: string
  setSubmissionId: (submissionId: string | null) => void
  count?: number
  metadata: SubmissionMetadata[]
  filteredCount?: number
  filteredMetadata: SubmissionMetadata[]
  isLoading: boolean
  isAnyFetching: boolean
  isInfiniteScroll: boolean
  columnOptions: ResponseColumnOption[]
  setColumnOptions: (columnOptions: ResponseColumnOption[]) => void
  hiddenColumnIds: string[]
  toggleColumnVisibility: (columnId: string) => void
  setAllColumnsVisible: (isVisible: boolean) => void
  /** Every filter must match, so each one narrows the rows. */
  columnFilters: SavedViewColumnFilter[]
  /** Blank text clears the column's filter. */
  setColumnFilter: (columnId: string, text: string) => void
  clearColumnFilters: () => void
  sortColumnId?: string
  sortDirection: ResponseSortDirection
  setSort: (
    columnId: string | undefined,
    direction: ResponseSortDirection,
  ) => void
  /** Rows left by the column filters, undefined when none are applied. */
  filterResultCount?: number
  setFilterResultCount: (count?: number) => void
  visibleSubmissionIds?: string[]
  setVisibleSubmissionIds: (submissionIds?: string[]) => void
  isFullyLoaded: boolean
  isShowingRecentOnly: boolean
  savedViews: FormSavedView[]
  selectedViewId: string
  applyView: (viewId: string) => void
  hasActiveFilters: boolean
  currentViewState: ResponsesViewState
  isTableLoading: boolean
  renderLimit: number
  showMoreRows: () => void
  renderedRowCount: number
  setRenderedRowCount: (count: number) => void
  onRowClick: () => void
  /** Neighbours of a response in the order the table shows them. */
  getAdjacentSubmissions: (submissionId: string) => {
    previous?: SubmissionMetadata
    next?: SubmissionMetadata
  }
  /**
   * Keeps the navigated-to response in the table: on its page when paginated,
   * or within the rendered rows otherwise.
   */
  onNavigateToSubmission: (submissionId: string) => void
  lastNavPage?: number
  lastNavSubmissionId?: string
}

const UnlockedResponsesContext = createContext<
  UnlockedResponsesContextProps | undefined
>(undefined)

export const useUnlockedResponses = (): UnlockedResponsesContextProps => {
  const context = useContext(UnlockedResponsesContext)
  if (!context) {
    throw new Error(
      `useUnlockedResponsesContext must be used within a UnlockedResponsesProvider component`,
    )
  }
  return context
}

const useProvideUnlockedResponses = (): UnlockedResponsesContextProps => {
  const isInfiniteScroll = useIsDelightfulDashboard()

  const [columnOptions, setColumnOptions] = useState<ResponseColumnOption[]>([])
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([])

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setHiddenColumnIds((hidden) =>
      hidden.includes(columnId)
        ? hidden.filter((id) => id !== columnId)
        : [...hidden, columnId],
    )
  }, [])

  const setAllColumnsVisible = useCallback(
    (isVisible: boolean) =>
      setHiddenColumnIds(isVisible ? [] : columnOptions.map(({ id }) => id)),
    [columnOptions],
  )

  const [sortColumnId, setSortColumnId] = useState<string>()
  const [sortDirection, setSortDirection] = useState<ResponseSortDirection>(
    SavedViewSortDirection.Descending,
  )

  const setSort = useCallback(
    (columnId: string | undefined, direction: ResponseSortDirection) => {
      setSortColumnId(columnId)
      setSortDirection(direction)
    },
    [],
  )

  const [renderedRowCount, setRenderedRowCount] = useState(0)
  const [filterResultCount, setFilterResultCount] = useState<number>()
  const [visibleSubmissionIds, setVisibleSubmissionIds] = useState<string[]>()
  const [columnFilters, setColumnFilters] = useState<SavedViewColumnFilter[]>(
    [],
  )

  const setColumnFilter = useCallback(
    (columnId: string, text: string) =>
      setColumnFilters((current) =>
        withColumnFilter(current, columnId, text, columnOptions),
      ),
    [columnOptions],
  )

  const clearColumnFilters = useCallback(() => setColumnFilters([]), [])

  const {
    page: [currentPage, setCurrentPage],
    submissionId: [submissionId, setSubmissionId],
  } = usePageSearchParams()
  // Storing the params in the state for navigation when user returns from
  // individual response view.
  const [lastNavPage, setLastNavPage] = useState(currentPage)
  const [lastNavSubmissionId, setLastNavSubmissionId] = useState(submissionId)

  useEffect(() => {
    if (currentPage && currentPage !== lastNavPage) {
      setLastNavPage(currentPage)
    }
  }, [currentPage, lastNavPage])

  const onRowClick = useCallback(() => {
    setLastNavSubmissionId(submissionId)
    setLastNavPage(currentPage ?? 1)
  }, [currentPage, submissionId])

  const {
    data: { count: filteredCount, metadata: filteredMetadata = [] } = {},
    isFetching: isFilterFetching,
  } = useFormResponses({
    // Will not run if submissionId does not exist.
    page: 0,
    submissionId,
  })

  // Track the pages to use for various metadata.
  const pages = useMemo(() => {
    // Use current page if it exists, else use last navigated page.
    const pageToUse = currentPage ?? lastNavPage ?? 1

    return {
      prev: Math.max(pageToUse - 1, 0),
      current: pageToUse,
      next: pageToUse + 1,
    }
  }, [currentPage, lastNavPage])

  const paginationEnabled = !isInfiniteScroll

  const {
    data: { count: pagedCount, metadata: pagedMetadata = [] } = {},
    isLoading: isPagedLoading,
  } = useFormResponses({ page: pages.current, enabled: paginationEnabled })

  const {
    data: { metadata: prevMetadata = [] } = {},
    isFetching: isPrevFetching,
  } = useFormResponses({ page: pages.prev, enabled: paginationEnabled })
  const {
    data: { metadata: nextMetadata = [] } = {},
    isFetching: isNextFetching,
  } = useFormResponses({ page: pages.next, enabled: paginationEnabled })

  const { data: allData, isLoading: isLoadingAll } = useAllFormResponses({
    enabled: isInfiniteScroll && !submissionId,
  })

  const { isFetching: isDecryptingAll } = useDecryptedResponsesBySubmissionId({
    enabled: isInfiniteScroll,
  })

  const allMetadata = useMemo(() => allData?.metadata ?? [], [allData])

  useDecryptNewResponses({
    metadata: allMetadata,
    isDecryptingAll,
    enabled: isInfiniteScroll && !submissionId,
  })

  const isTableLoading = isLoadingAll || isDecryptingAll

  const [renderLimit, setRenderLimit] = useState(TABLE_ROW_RENDER_CHUNK)

  useEffect(() => {
    setRenderLimit(TABLE_ROW_RENDER_CHUNK)
  }, [allMetadata])

  const showMoreRows = useCallback(
    () => setRenderLimit((limit) => limit + TABLE_ROW_RENDER_CHUNK),
    [],
  )

  const metadata = isInfiniteScroll ? allMetadata : pagedMetadata
  const count = isInfiniteScroll ? allData?.count : pagedCount
  const isFullyLoaded = !!allData && allMetadata.length >= (allData.count ?? 0)

  const isShowingRecentOnly =
    isInfiniteScroll && exceedsTableLimit(allData?.count)
  const isLoading = isInfiniteScroll ? isTableLoading : isPagedLoading

  const isAnyFetching = useMemo(
    () =>
      isLoading ||
      isFilterFetching ||
      (isInfiniteScroll ? false : isPrevFetching || isNextFetching),
    [
      isFilterFetching,
      isInfiniteScroll,
      isLoading,
      isNextFetching,
      isPrevFetching,
    ],
  )

  // Responses in the order the admin sees them, spanning the neighbouring
  // pages when paginated so the arrows can cross a page boundary. A response
  // ID search shows one row, so there is nothing to step through.
  const navigableMetadata = useMemo(() => {
    if (lastNavSubmissionId) return []
    if (!isInfiniteScroll) {
      return [...prevMetadata, ...pagedMetadata, ...nextMetadata]
    }
    if (!visibleSubmissionIds) return allMetadata
    const byRefNo = new Map<string, SubmissionMetadata>(
      allMetadata.map((row) => [row.refNo, row]),
    )
    return visibleSubmissionIds.flatMap((refNo) => byRefNo.get(refNo) ?? [])
  }, [
    allMetadata,
    isInfiniteScroll,
    lastNavSubmissionId,
    nextMetadata,
    pagedMetadata,
    prevMetadata,
    visibleSubmissionIds,
  ])

  const getAdjacentSubmissions = useCallback(
    (submissionId: string) => {
      if (isAnyFetching) return {}
      const index = navigableMetadata.findIndex(
        (row) => row.refNo === submissionId,
      )
      if (index === -1) return {}
      return {
        previous: navigableMetadata[index - 1],
        next: navigableMetadata[index + 1],
      }
    },
    [isAnyFetching, navigableMetadata],
  )

  const onNavigateToSubmission = useCallback(
    (submissionId: string) => {
      if (isInfiniteScroll) {
        const index = navigableMetadata.findIndex(
          (row) => row.refNo === submissionId,
        )
        if (index !== -1) {
          setRenderLimit((limit) => renderLimitToInclude(index, limit))
        }
        return
      }
      if (prevMetadata.some((row) => row.refNo === submissionId)) {
        setLastNavPage((page) => Math.max((page ?? 1) - 1, 1))
      } else if (nextMetadata.some((row) => row.refNo === submissionId)) {
        setLastNavPage((page) => (page ?? 1) + 1)
      }
    },
    [isInfiniteScroll, navigableMetadata, nextMetadata, prevMetadata],
  )

  const { data: form } = useAdminForm()
  const { dateRange, setDateRange } = useStorageResponsesContext()
  const savedViews = useMemo(() => form?.savedViews ?? [], [form?.savedViews])
  const [selectedViewId, setSelectedViewId] = useState(ALL_RESPONSES_VIEW_ID)

  const currentViewState: ResponsesViewState = useMemo(
    () => ({
      dateRange,
      columnFilters,
      hiddenColumnIds,
      sortColumnId,
      sortDirection,
    }),
    [columnFilters, dateRange, hiddenColumnIds, sortColumnId, sortDirection],
  )

  const hasActiveFilters = hasActiveViewState(currentViewState)

  const applyView = useCallback(
    (viewId: string) => {
      setSelectedViewId(viewId)
      const view = savedViews.find(({ _id }) => _id === viewId)
      if (view) {
        logAnalyticsEvent(form?._id, {
          type: AnalyticsEventType.ResultsSavedViewApplied,
          content: { savedViewId: view._id },
        })
      }
      const next = view ? fromSavedView(view, columnOptions) : EMPTY_VIEW_STATE
      setDateRange(next.dateRange)
      setColumnFilters(next.columnFilters)
      setHiddenColumnIds(next.hiddenColumnIds)
      setSortColumnId(next.sortColumnId)
      setSortDirection(next.sortDirection)
    },
    [columnOptions, form?._id, savedViews, setDateRange],
  )

  return {
    currentPage,
    setCurrentPage,
    count,
    metadata,
    isLoading,
    isAnyFetching,
    isInfiniteScroll,
    columnOptions,
    setColumnOptions,
    hiddenColumnIds,
    toggleColumnVisibility,
    setAllColumnsVisible,
    columnFilters,
    setColumnFilter,
    clearColumnFilters,
    sortColumnId,
    sortDirection,
    setSort,
    filterResultCount,
    setFilterResultCount,
    visibleSubmissionIds,
    setVisibleSubmissionIds,
    isFullyLoaded,
    isShowingRecentOnly,
    savedViews,
    selectedViewId,
    applyView,
    hasActiveFilters,
    currentViewState,
    isTableLoading,
    renderLimit,
    showMoreRows,
    renderedRowCount,
    setRenderedRowCount,
    lastNavPage,
    lastNavSubmissionId,
    filteredCount,
    filteredMetadata,
    submissionId,
    setSubmissionId,
    onRowClick,
    getAdjacentSubmissions,
    onNavigateToSubmission,
  }
}

export const UnlockedResponsesProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const values = useProvideUnlockedResponses()

  return (
    <UnlockedResponsesContext.Provider value={values}>
      {children}
    </UnlockedResponsesContext.Provider>
  )
}
