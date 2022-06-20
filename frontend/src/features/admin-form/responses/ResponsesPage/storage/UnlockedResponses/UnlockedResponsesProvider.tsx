import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { StorageModeSubmissionMetadata, SubmissionId } from '~shared/types'

import { useFormResponses } from '~features/admin-form/responses/queries'

import { usePageSearchParams } from './hooks/usePageSearchParams'

const PAGE_SIZE = 10

interface UnlockedResponsesContextProps {
  currentPage?: number
  setCurrentPage: (page: number) => void
  submissionId?: string
  setSubmissionId: (submissionId: string | null) => void
  count?: number
  metadata: StorageModeSubmissionMetadata[]
  filteredCount?: number
  filteredMetadata: StorageModeSubmissionMetadata[]
  isLoading: boolean
  isAnyFetching: boolean
  getNextSubmissionId: (currentSubmissionId: string) => SubmissionId | undefined
  getPreviousSubmissionId: (
    currentSubmissionId: string,
  ) => SubmissionId | undefined
  onNavNextSubmissionId: (currentSubmissionId: string) => void
  onNavPreviousSubmissionId: (currentSubmissionId: string) => void
  lastNavPage?: number
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
  const {
    page: [currentPage, setCurrentPage],
    submissionId: [submissionId, setSubmissionId],
  } = usePageSearchParams()
  // Storing the params in the state for navigation when user returns from
  // individual response view.
  const [lastNavPage, setLastNavPage] = useState(currentPage)

  useEffect(() => {
    if (currentPage && currentPage !== lastNavPage) {
      setLastNavPage(currentPage)
    }
  }, [currentPage, lastNavPage])

  const {
    data: { count: filteredCount, metadata: filteredMetadata = [] } = {},
    isFetching: isFilterFetching,
  } = useFormResponses({
    // Will not run if submissionId does not exist.
    page: 0,
    submissionId,
  })

  const { data: { count, metadata = [] } = {}, isLoading } = useFormResponses({
    page: lastNavPage ?? 1,
  })
  const {
    data: { metadata: prevMetadata = [] } = {},
    isFetching: isPrevFetching,
  } = useFormResponses({ page: currentPage ? 0 : lastNavPage ?? 0 })
  const {
    data: { metadata: nextMetadata = [] } = {},
    isFetching: isNextFetching,
  } = useFormResponses({ page: currentPage ? 0 : lastNavPage ?? 2 })

  const totalPageCount = useMemo(
    () => (count ? Math.ceil(count / PAGE_SIZE) : 0),
    [count],
  )

  const isAnyFetching = useMemo(
    () => isLoading || isPrevFetching || isNextFetching || isFilterFetching,
    [isFilterFetching, isLoading, isNextFetching, isPrevFetching],
  )

  const onNavNextSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyFetching || (lastNavPage ?? 1) >= totalPageCount) return
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
    [isAnyFetching, lastNavPage, metadata, totalPageCount],
  )

  const onNavPreviousSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyFetching) return

      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      // If id belongs to the first submission in page, return last of previous page
      if (currentResponseIndex === 0 && lastNavPage && lastNavPage > 1) {
        setLastNavPage(lastNavPage - 1)
      }
    },
    [isAnyFetching, lastNavPage, metadata],
  )

  const getNextSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyFetching) return
      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      if (currentResponseIndex === -1) return

      // If id belongs to the last submission in page, return first of next page
      if (currentResponseIndex === metadata.length - 1) {
        return nextMetadata[0]?.refNo
      }
      return metadata[currentResponseIndex + 1]?.refNo
    },
    [isAnyFetching, metadata, nextMetadata],
  )

  const getPreviousSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyFetching) return

      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )

      if (currentResponseIndex === -1) return

      // If id belongs to the first submission in page, return last of previous page
      if (currentResponseIndex === 0 && lastNavPage && lastNavPage > 1) {
        return prevMetadata[prevMetadata.length - 1]?.refNo
      }
      return metadata[currentResponseIndex - 1]?.refNo
    },
    [isAnyFetching, lastNavPage, metadata, prevMetadata],
  )

  return {
    currentPage,
    setCurrentPage,
    count,
    metadata,
    isLoading,
    isAnyFetching,
    getNextSubmissionId,
    getPreviousSubmissionId,
    onNavNextSubmissionId,
    onNavPreviousSubmissionId,
    lastNavPage,
    filteredCount,
    filteredMetadata,
    submissionId,
    setSubmissionId,
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
