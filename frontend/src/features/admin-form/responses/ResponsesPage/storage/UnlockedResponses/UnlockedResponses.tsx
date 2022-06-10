import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Flex, Grid, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Pagination from '~components/Pagination'

import { useFormResponses } from '~features/admin-form/responses/queries'

import { DownloadButton } from './DownloadButton'
import { ResponsesTable } from './ResponsesTable'

const useUnlockedResponses = () => {
  const [params, setParams] = useSearchParams()
  // Storing the params in the state for navigation when user returns from
  // individual response view.
  const [currentPage, setCurrentPage] = useState(
    Number(params.get('page')) || 1,
  )
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

  useEffect(() => {
    setParams({ page: String(currentPage) })
  }, [currentPage, setParams])

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
    [currentPage, isAnyLoading, metadata, nextMetadata],
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
    [currentPage, isAnyLoading, metadata, prevMetadata],
  )

  return {
    currentPage,
    setCurrentPage,
    count,
    metadata,
    isLoading,
    isAnyLoading,
    getNextSubmissionId,
    getPreviousSubmissionId,
  }
}

export const UnlockedResponses = (): JSX.Element => {
  const { currentPage, setCurrentPage, metadata, count, isLoading } =
    useUnlockedResponses()

  const prettifiedResponsesCount = useMemo(() => {
    if (!count) return
    return simplur` ${[count]}response[|s] to date`
  }, [count])

  return (
    <Flex flexDir="column" h="100%">
      <Grid
        mb="1rem"
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto', md: 'auto 1fr' }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        gridTemplateAreas={{
          base: "'submissions submissions' 'export'",
          md: "'submissions export'",
        }}
      >
        <Box gridArea="submissions">
          <Text textStyle="h4">
            <Text as="span" color="primary.500">
              {count?.toLocaleString()}
            </Text>
            {prettifiedResponsesCount}
          </Text>
        </Box>
        <DownloadButton />
      </Grid>
      <Box mb="3rem" overflow="auto" flex={1}>
        <ResponsesTable
          metadata={metadata ?? []}
          currentPage={currentPage - 1}
        />
      </Box>
      <Box display={isLoading || count === 0 ? 'none' : ''}>
        <Pagination
          totalCount={count ?? 0}
          currentPage={currentPage} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Flex>
  )
}
