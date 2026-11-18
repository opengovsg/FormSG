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
  RESPONSE_NUMBER_COLUMN_ID,
  ResponsesViewState,
  withColumnFilter,
} from './savedViews'

const EMPTY_METADATA: SubmissionMetadata[] = []

export const ALL_RESPONSES_VIEW_ID = 'all-responses'

const EMPTY_VIEW_STATE: ResponsesViewState = {
  dateRange: [] as DateString[],
  columnFilters: [],
  hiddenColumnIds: [],
  sortColumnId: undefined,
  sortDirection: SavedViewSortDirection.Descending,
}

export type ResponseCountState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; count: number }

export type ResponseSortDirection = SavedViewSortDirection

const isFilterValueSet = (value: string | string[]) =>
  Array.isArray(value) ? value.length > 0 : value.trim() !== ''

const logFilterApplied = (formId: string | undefined, columnId?: string) =>
  logAnalyticsEvent(formId, {
    type: AnalyticsEventType.ResultsFilterApplied,
    content: columnId
      ? { filter: 'column', columnId }
      : { filter: 'date_range' },
  })

const logSortApplied = (
  formId: string | undefined,
  columnId: string | undefined,
  direction: ResponseSortDirection,
) =>
  logAnalyticsEvent(formId, {
    type: AnalyticsEventType.ResultsSortApplied,
    content: { direction, columnId: columnId ?? RESPONSE_NUMBER_COLUMN_ID },
  })

const logColumnToggled = (
  formId: string | undefined,
  columnId: string,
  visible: boolean,
) =>
  logAnalyticsEvent(formId, {
    type: AnalyticsEventType.ResultsColumnToggled,
    content: { visible, columnId },
  })

const logViewState = (
  formId: string | undefined,
  state: ResponsesViewState,
) => {
  if (state.dateRange.length === 2) logFilterApplied(formId)
  state.columnFilters.forEach(({ columnId }) =>
    logFilterApplied(formId, columnId),
  )
  if (state.sortColumnId) {
    logSortApplied(formId, state.sortColumnId, state.sortDirection)
  }
  state.hiddenColumnIds.forEach((columnId) =>
    logColumnToggled(formId, columnId, false),
  )
}

export interface ResponseColumnOption {
  id: string
  label: string
  filterValues?: string[]
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
  /** Blank text, or every one of the column's values, clears its filter. */
  setColumnFilter: (columnId: string, value: string | string[]) => void
  clearColumnFilters: () => void
  sortColumnId?: string
  sortDirection: ResponseSortDirection
  setSort: (
    columnId: string | undefined,
    direction: ResponseSortDirection,
  ) => void
  responseCountState: ResponseCountState
  responseCountScope: object
  reportMatchingCount: (result: { scope: object; count: number }) => void
  visibleSubmissionIds?: string[]
  setVisibleSubmissionIds: (submissionIds?: string[]) => void
  isFullyLoaded: boolean
  isShowingRecentOnly: boolean
  savedViews: FormSavedView[]
  selectedViewId: string
  applyView: (viewId: string) => void
  selectView: (viewId: string) => void
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
  const { data: form } = useAdminForm()
  const formId = form?._id

  const [columnOptions, setColumnOptions] = useState<ResponseColumnOption[]>([])
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([])

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      logColumnToggled(formId, columnId, hiddenColumnIds.includes(columnId))
      setHiddenColumnIds((hidden) =>
        hidden.includes(columnId)
          ? hidden.filter((id) => id !== columnId)
          : [...hidden, columnId],
      )
    },
    [formId, hiddenColumnIds],
  )

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
      logSortApplied(formId, columnId, direction)
      setSortColumnId(columnId)
      setSortDirection(direction)
    },
    [formId],
  )

  const [renderedRowCount, setRenderedRowCount] = useState(0)
  const [matchingCount, reportMatchingCount] = useState<{
    scope: object
    count: number
  }>()
  const [visibleSubmissionIds, setVisibleSubmissionIds] = useState<string[]>()
  const [columnFilters, setColumnFilters] = useState<SavedViewColumnFilter[]>(
    [],
  )

  const setColumnFilter = useCallback(
    (columnId: string, value: string | string[]) => {
      if (isFilterValueSet(value)) logFilterApplied(formId, columnId)
      setColumnFilters((current) =>
        withColumnFilter(current, columnId, value, columnOptions),
      )
    },
    [columnOptions, formId],
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
    data: {
      count: filteredCount,
      metadata: filteredMetadata = EMPTY_METADATA,
    } = {},
    isFetching: isFilterFetching,
    isError: isFilterError,
    dataUpdatedAt: searchUpdatedAt,
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

  const {
    data: allData,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
    isError: isAllError,
    dataUpdatedAt: allUpdatedAt,
  } = useAllFormResponses({
    enabled: isInfiniteScroll && !submissionId,
  })

  const {
    data: decryptedResponses,
    isFetching: isDecryptingAll,
    isError: isDecryptError,
    dataUpdatedAt: decryptUpdatedAt,
  } = useDecryptedResponsesBySubmissionId({
    enabled: isInfiniteScroll,
  })

  const allMetadata = useMemo(() => allData?.metadata ?? [], [allData])

  const newDecryption = useDecryptNewResponses({
    metadata: submissionId ? filteredMetadata : allMetadata,
    isDecryptingAll,
    enabled: isInfiniteScroll,
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

  // A report belongs to both its inputs and its result sources. Old table
  // effects cannot publish a count for a newly selected view or refreshed data.
  const responseCountScope = useMemo(
    () => ({}),
    // This opaque token changes whenever any count input or source changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      submissionId,
      dateRange,
      columnFilters,
      allData,
      allUpdatedAt,
      filteredMetadata,
      searchUpdatedAt,
      decryptedResponses,
      decryptUpdatedAt,
      isFetchingAll,
      isFilterFetching,
      isDecryptingAll,
    ],
  )
  const countSource = submissionId ? filteredCount : count
  const countMetadata = submissionId ? filteredMetadata : allMetadata
  const hasUndecryptedRows = countMetadata.some(
    ({ refNo }) => !decryptedResponses?.has(refNo),
  )
  let responseCountState: ResponseCountState
  if (
    (submissionId ? isFilterFetching : isLoadingAll || isFetchingAll) ||
    isDecryptingAll
  ) {
    responseCountState = { status: 'loading' }
  } else if (
    (submissionId ? isFilterError : isAllError) ||
    isDecryptError ||
    newDecryption?.isError
  ) {
    responseCountState = { status: 'error' }
  } else if (
    hasUndecryptedRows ||
    countSource === undefined ||
    (columnFilters.length > 0 && matchingCount?.scope !== responseCountScope)
  ) {
    responseCountState = { status: 'loading' }
  } else {
    responseCountState = {
      status: 'ready',
      count: columnFilters.length ? matchingCount!.count : countSource,
    }
  }

  const hasActiveFilters = hasActiveViewState(currentViewState)

  const applyView = useCallback(
    (viewId: string) => {
      setSelectedViewId(viewId)
      const view = savedViews.find(({ _id }) => _id === viewId)
      if (view) {
        logAnalyticsEvent(formId, {
          type: AnalyticsEventType.ResultsSavedViewApplied,
          content: { savedViewId: view._id },
        })
      }
      const next = view ? fromSavedView(view, columnOptions) : EMPTY_VIEW_STATE
      if (view) logViewState(formId, next)
      setDateRange(next.dateRange)
      setColumnFilters(next.columnFilters)
      setHiddenColumnIds(next.hiddenColumnIds)
      setSortColumnId(next.sortColumnId)
      setSortDirection(next.sortDirection)
    },
    [columnOptions, formId, savedViews, setDateRange],
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
    responseCountState,
    responseCountScope,
    reportMatchingCount,
    visibleSubmissionIds,
    setVisibleSubmissionIds,
    isFullyLoaded,
    isShowingRecentOnly,
    savedViews,
    selectedViewId,
    applyView,
    selectView: setSelectedViewId,
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
