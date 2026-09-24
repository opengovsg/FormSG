import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { SubmissionId, SubmissionMetadata } from 'formsg-shared/types'

import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'
import {
  useAllFormResponses,
  useDecryptedResponsesBySubmissionId,
  useFormResponses,
} from '~features/admin-form/responses/queries'

import { TABLE_ROW_RENDER_CHUNK } from '../../../constants'

import { usePageSearchParams } from './hooks/usePageSearchParams'

const PAGE_SIZE = 10

export type ResponseSortDirection = 'asc' | 'desc'

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
  searchText: string
  setSearchText: (searchText: string) => void
  excludedSearchColumnIds: string[]
  toggleSearchColumn: (columnId: string) => void
  setAllSearchColumns: (isSearchable: boolean) => void
  sortColumnId?: string
  sortDirection: ResponseSortDirection
  setSort: (
    columnId: string | undefined,
    direction: ResponseSortDirection,
  ) => void
  searchResultCount?: number
  setSearchResultCount: (count?: number) => void
  visibleSubmissionIds?: string[]
  setVisibleSubmissionIds: (submissionIds?: string[]) => void
  isFullyLoaded: boolean
  isTableLoading: boolean
  renderLimit: number
  showMoreRows: () => void
  renderedRowCount: number
  setRenderedRowCount: (count: number) => void
  getNextSubmissionId: (currentSubmissionId: string) => SubmissionId | undefined
  getPreviousSubmissionId: (
    currentSubmissionId: string,
  ) => SubmissionId | undefined
  onNavNextSubmissionId: (currentSubmissionId: string) => void
  onNavPreviousSubmissionId: (currentSubmissionId: string) => void
  onRowClick: () => void
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

  const [sortColumnId, setSortColumnId] = useState<string>()
  const [sortDirection, setSortDirection] =
    useState<ResponseSortDirection>('desc')

  const setSort = useCallback(
    (columnId: string | undefined, direction: ResponseSortDirection) => {
      setSortColumnId(columnId)
      setSortDirection(direction)
    },
    [],
  )

  const [renderedRowCount, setRenderedRowCount] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [searchResultCount, setSearchResultCount] = useState<number>()
  const [visibleSubmissionIds, setVisibleSubmissionIds] = useState<string[]>()
  const [excludedSearchColumnIds, setExcludedSearchColumnIds] = useState<
    string[]
  >([])

  const toggleSearchColumn = useCallback((columnId: string) => {
    setExcludedSearchColumnIds((excluded) =>
      excluded.includes(columnId)
        ? excluded.filter((id) => id !== columnId)
        : [...excluded, columnId],
    )
  }, [])

  const setAllSearchColumns = useCallback(
    (isSearchable: boolean) =>
      setExcludedSearchColumnIds(
        isSearchable ? [] : columnOptions.map(({ id }) => id),
      ),
    [columnOptions],
  )

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

  const { data: allData, isFetching: isFetchingAll } = useAllFormResponses({
    enabled: isInfiniteScroll && !submissionId,
  })

  const { isFetching: isDecryptingAll } = useDecryptedResponsesBySubmissionId({
    enabled: isInfiniteScroll,
  })

  const allMetadata = useMemo(() => allData?.metadata ?? [], [allData])

  const isTableLoading = isFetchingAll || isDecryptingAll

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
  const isLoading = isInfiniteScroll ? isTableLoading : isPagedLoading

  const totalPageCount = useMemo(
    () => (count ? Math.ceil(count / PAGE_SIZE) : 0),
    [count],
  )

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

  const onNavNextSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (
        isInfiniteScroll ||
        isAnyFetching ||
        (lastNavPage ?? 1) >= totalPageCount ||
        !!lastNavSubmissionId
      )
        return
      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      if (currentResponseIndex === -1) return

      // If id belongs to the last submission in page, return first of next page
      if (currentResponseIndex === metadata.length - 1) {
        setLastNavPage((lastNavPage ?? 1) + 1)
      }
    },
    [
      isAnyFetching,
      isInfiniteScroll,
      lastNavPage,
      lastNavSubmissionId,
      metadata,
      totalPageCount,
    ],
  )

  const onNavPreviousSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isInfiniteScroll || isAnyFetching || !!lastNavSubmissionId) return

      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      // If id belongs to the first submission in page, return last of previous page
      if (currentResponseIndex === 0 && lastNavPage && lastNavPage > 1) {
        setLastNavPage(lastNavPage - 1)
      }
    },
    [
      isAnyFetching,
      isInfiniteScroll,
      lastNavPage,
      lastNavSubmissionId,
      metadata,
    ],
  )

  const getNextSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyFetching || !!lastNavSubmissionId) return
      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      if (currentResponseIndex === -1) return

      if (isInfiniteScroll) return metadata[currentResponseIndex + 1]?.refNo

      // If id belongs to the last submission in page, return first of next page
      if (currentResponseIndex === metadata.length - 1) {
        return nextMetadata[0]?.refNo
      }
      return metadata[currentResponseIndex + 1]?.refNo
    },
    [
      isAnyFetching,
      isInfiniteScroll,
      metadata,
      nextMetadata,
      lastNavSubmissionId,
    ],
  )

  const getPreviousSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyFetching || !!lastNavSubmissionId) return

      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      if (currentResponseIndex === -1) return

      if (isInfiniteScroll) return metadata[currentResponseIndex - 1]?.refNo

      // If id belongs to the first submission in page, return last of previous page
      if (currentResponseIndex === 0 && lastNavPage && lastNavPage > 1) {
        return prevMetadata[prevMetadata.length - 1]?.refNo
      }
      return metadata[currentResponseIndex - 1]?.refNo
    },
    [
      isAnyFetching,
      isInfiniteScroll,
      lastNavPage,
      metadata,
      prevMetadata,
      lastNavSubmissionId,
    ],
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
    searchText,
    setSearchText,
    excludedSearchColumnIds,
    toggleSearchColumn,
    setAllSearchColumns,
    sortColumnId,
    sortDirection,
    setSort,
    searchResultCount,
    setSearchResultCount,
    visibleSubmissionIds,
    setVisibleSubmissionIds,
    isFullyLoaded,
    isTableLoading,
    renderLimit,
    showMoreRows,
    renderedRowCount,
    setRenderedRowCount,
    getNextSubmissionId,
    getPreviousSubmissionId,
    onNavNextSubmissionId,
    onNavPreviousSubmissionId,
    lastNavPage,
    lastNavSubmissionId,
    filteredCount,
    filteredMetadata,
    submissionId,
    setSubmissionId,
    onRowClick,
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
