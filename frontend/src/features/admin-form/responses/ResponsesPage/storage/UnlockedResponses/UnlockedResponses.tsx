import { useCallback, useMemo } from 'react'
import { Box, Flex, Grid, Skeleton, Stack, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import Button from '~components/Button'
import Pagination from '~components/Pagination'

import { DownloadButton } from './DownloadButton'
import { ResponsesTable } from './ResponsesTable'
import { SubmissionSearchbar } from './SubmissionSearchbar'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const UnlockedResponses = (): JSX.Element => {
  const {
    currentPage,
    setCurrentPage,
    count,
    filteredCount,
    isLoading,
    submissionId,
    isAnyFetching,
    setSubmissionId,
  } = useUnlockedResponses()

  const countToUse = useMemo(() => {
    if (submissionId) {
      return filteredCount
    }
    return count
  }, [filteredCount, count, submissionId])

  const prettifiedResponsesCount = useMemo(() => {
    if (filteredCount !== undefined) {
      return simplur` ${[filteredCount]}result[|s] found`
    } else if (count !== undefined) {
      return simplur` ${[count]}response[|s] to date`
    }
  }, [count, filteredCount])

  const clearSubmissionId = useCallback(() => {
    setSubmissionId(null)
  }, [setSubmissionId])

  return (
    <Flex flexDir="column" h="100%">
      <Grid
        mb="1rem"
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto', md: 'auto 1fr' }}
        gridGap={{ base: '0.5rem', md: '1.5rem' }}
        gridTemplateAreas={{
          base: "'submissions' 'export'",
          md: "'submissions export'",
        }}
      >
        <Stack
          align="center"
          spacing="1rem"
          direction="row"
          gridArea="submissions"
        >
          <Skeleton isLoaded={!isAnyFetching}>
            <Text textStyle="h4">
              <Text as="span" color="primary.500">
                {countToUse?.toLocaleString()}
              </Text>
              {prettifiedResponsesCount}
            </Text>
          </Skeleton>
          {submissionId && (
            <Button onClick={clearSubmissionId} variant="link">
              Reset
            </Button>
          )}
        </Stack>
        <Stack direction="row" gridArea="export" justifySelf="end">
          <SubmissionSearchbar />
          <DownloadButton />
        </Stack>
      </Grid>
      <Box mb="3rem" overflow="auto" flex={1}>
        <ResponsesTable />
      </Box>
      <Box display={isLoading || countToUse === 0 ? 'none' : ''}>
        <Pagination
          totalCount={countToUse ?? 0}
          currentPage={currentPage ?? 1} //1-indexed
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Flex>
  )
}
