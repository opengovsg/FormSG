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

interface UnlockedResponsesContextProps {
  currentPage: number
  setCurrentPage: (page: number) => void
  count?: number
  metadata: StorageModeSubmissionMetadata[]
  isLoading: boolean
  isAnyLoading: boolean
  getNextSubmissionId: (currentSubmissionId: string) => SubmissionId | undefined
  getPreviousSubmissionId: (
    currentSubmissionId: string,
  ) => SubmissionId | undefined
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

const useProvideUnlockedResponses = () => {
  const [currentPage, setCurrentPage] = usePageSearchParams()
  // Storing the params in the state for navigation when user returns from
  // individual response view.
  const [lastNavPage, setLastNavPage] = useState(currentPage)

  useEffect(() => {
    if (currentPage && currentPage !== lastNavPage) {
      setLastNavPage(currentPage)
    }
  }, [currentPage, lastNavPage])

  const { data: { count, metadata = [] } = {}, isLoading } =
    useFormResponses(currentPage)
  const {
    data: { metadata: prevMetadata = [] } = {},
    isLoading: isPrevLoading,
  } = useFormResponses(currentPage - 1)
  const {
    data: { metadata: nextMetadata = [] } = {},
    isLoading: isNextLoading,
  } = useFormResponses(currentPage + 1)

  const isAnyLoading = useMemo(
    () => isLoading || isPrevLoading || isNextLoading,
    [isLoading, isNextLoading, isPrevLoading],
  )

  const getNextSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyLoading) return
      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )
      // If id belongs to the last submission in page, return first of next page
      if (currentResponseIndex === metadata.length - 1) {
        const data = nextMetadata[0]
        setCurrentPage(currentPage + 1)
        return data?.refNo
      } else {
        return metadata[currentResponseIndex + 1]?.refNo
      }
    },
    [currentPage, isAnyLoading, metadata, nextMetadata, setCurrentPage],
  )

  const getPreviousSubmissionId = useCallback(
    (currentSubmissionId: string) => {
      if (isAnyLoading) return

      // Get row index of current submission in the metadata.
      const currentResponseIndex = metadata.findIndex(
        (response) => response.refNo === currentSubmissionId,
      )
      // If id belongs to the first submission in page, return last of previous page
      if (currentResponseIndex === 0) {
        if (currentPage === 1) return
        const data = prevMetadata[prevMetadata.length - 1]
        setCurrentPage(currentPage - 1)
        return data?.refNo
      } else {
        return metadata[currentResponseIndex - 1]?.refNo
      }
    },
    [currentPage, isAnyLoading, metadata, prevMetadata, setCurrentPage],
  )

  const navigateBackToTable = useCallback(() => {
    setCurrentPage(lastNavPage)
  }, [lastNavPage, setCurrentPage])

  return {
    currentPage,
    setCurrentPage,
    count,
    metadata,
    isLoading,
    isAnyLoading,
    getNextSubmissionId,
    getPreviousSubmissionId,
    navigateBackToTable,
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
