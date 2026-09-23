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
  useFormResponses,
  useInfiniteFormResponses,
} from '~features/admin-form/responses/queries'

import { usePageSearchParams } from './hooks/usePageSearchParams'

const PAGE_SIZE = 10

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
  searchResultCount?: number
  setSearchResultCount: (count?: number) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
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

  const [searchText, setSearchText] = useState('')
  const [searchResultCount, setSearchResultCount] = useState<number>()
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

  const {
    data: infiniteData,
    isLoading: isInfiniteLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteFormResponses({
    enabled: isInfiniteScroll && !submissionId,
  })

  const infiniteMetadata = useMemo(
    () => infiniteData?.pages.flatMap((page) => page.metadata) ?? [],
    [infiniteData],
  )

  const metadata = isInfiniteScroll ? infiniteMetadata : pagedMetadata
  const count = isInfiniteScroll ? infiniteData?.pages[0]?.count : pagedCount
  const isLoading = isInfiniteScroll ? isInfiniteLoading : isPagedLoading

  const totalPageCount = useMemo(
    () => (count ? Math.ceil(count / PAGE_SIZE) : 0),
    [count],
  )

  const isAnyFetching = useMemo(
    () =>
      isLoading ||
      isFilterFetching ||
      (isInfiniteScroll
        ? isFetchingNextPage
        : isPrevFetching || isNextFetching),
    [
      isFilterFetching,
      isFetchingNextPage,
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

  const onFetchNextPage = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

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
    searchResultCount,
    setSearchResultCount,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage: onFetchNextPage,
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
