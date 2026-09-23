import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Grid,
  Skeleton,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { useInfiniteScrollTrigger } from './hooks/useInfiniteScrollTrigger'
import { DownloadButton } from './DownloadButton'
import { ResponsesTable } from './ResponsesTable'
import { ResponsesToolbar } from './ResponsesToolbar'
import { SubmissionSearchbar } from './SubmissionSearchbar'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const UnlockedResponses = (): JSX.Element => {
  const isDelightfulDashboard = useIsDelightfulDashboard()

  if (!isDelightfulDashboard) return <LegacyUnlockedResponses />

  return <DelightfulUnlockedResponses />
}

const DelightfulUnlockedResponses = (): JSX.Element => {
  const { t } = useTranslation()

  const {
    count,
    filteredCount,
    submissionId,
    isAnyFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    searchResultCount,
  } = useUnlockedResponses()

  const sentinelRef = useInfiniteScrollTrigger<HTMLDivElement>({
    onTrigger: fetchNextPage,
    enabled: !submissionId && hasNextPage && !isFetchingNextPage,
  })

  const countToUse = useMemo(
    () => (submissionId ? filteredCount : count),
    [submissionId, filteredCount, count],
  )

  return (
    <Flex
      flexDir="column"
      pr={{ base: '1rem', md: '1.75rem', lg: '2rem' }}
      w="100%"
      maxW="100%"
      minW={0}
    >
      <Flex
        direction="column"
        mb="1rem"
        color="secondary.500"
        w="100%"
        maxW="100%"
        flexShrink={0}
      >
        <Skeleton isLoaded={!isAnyFetching} w={{ base: '100%', md: 'auto' }}>
          <Text
            textStyle="h4"
            mb={{ base: '0.25rem', md: '0.5rem' }}
            noOfLines={{ base: 2, md: 1 }}
          >
            <Text as="span" color="primary.500">
              {(searchResultCount ?? countToUse)?.toLocaleString()}
            </Text>{' '}
            {t(
              searchResultCount !== undefined
                ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.resultsFound'
                : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.responsesToDate',
              { count: searchResultCount ?? countToUse ?? 0 },
            )}
          </Text>
        </Skeleton>
      </Flex>

      <ResponsesToolbar />

      <Box
        mb="3rem"
        overflowX="auto"
        w="100%"
        minW={0}
        maxW="100%"
        sx={{
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'neutral.200',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'neutral.400',
            borderRadius: '4px',
            '&:hover': {
              background: 'neutral.500',
            },
          },
        }}
      >
        <ResponsesTable />
      </Box>

      <Flex
        ref={sentinelRef}
        justify="center"
        align="center"
        w="100%"
        minH="3rem"
        pb={{ base: '1rem', md: '0' }}
      >
        {isFetchingNextPage ? (
          <Spinner color="primary.500" thickness="2px" />
        ) : null}
      </Flex>
    </Flex>
  )
}

const LegacyUnlockedResponses = (): JSX.Element => {
  const { t } = useTranslation()

  const {
    currentPage,
    setCurrentPage,
    count,
    filteredCount,
    isLoading,
    submissionId,
    setSubmissionId,
    isAnyFetching,
  } = useUnlockedResponses()

  const countToUse = useMemo(
    () => (submissionId ? filteredCount : count),
    [submissionId, filteredCount, count],
  )

  const { dateRange, setDateRange } = useStorageResponsesContext()

  return (
    <Flex flexDir="column" h="100%">
      <Grid
        mb="1rem"
        alignItems="end"
        color="secondary.500"
        gridTemplateColumns={{ base: 'auto 1fr', lg: 'auto 1fr auto' }}
        gridGap="0.5rem"
        gridTemplateAreas={{
          base: "'submissions search' 'export export'",
          lg: "'submissions search export'",
        }}
      >
        <Stack
          align="center"
          spacing="1rem"
          direction="row"
          gridArea="submissions"
        >
          <Skeleton isLoaded={!isAnyFetching}>
            <Text textStyle="h4" mb="0.5rem">
              <Text as="span" color="primary.500">
                {countToUse?.toLocaleString()}
              </Text>{' '}
              {t(
                submissionId
                  ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.resultsFound'
                  : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.responsesToDate',
                { count: countToUse ?? 0 },
              )}
            </Text>
          </Skeleton>
        </Stack>

        <Flex gridArea="search" justifySelf="end">
          <SubmissionSearchbar
            submissionId={submissionId}
            setSubmissionId={setSubmissionId}
            isAnyFetching={isAnyFetching}
          />
        </Flex>

        <Stack
          direction={{ base: 'column', sm: 'row' }}
          justifySelf={{ base: 'start', sm: 'end' }}
          gridArea="export"
          maxW="100%"
        >
          <DateRangePicker
            value={dateRangePickerHelper.dateStringToDatePickerValue(dateRange)}
            onChange={(nextDateRange) =>
              setDateRange(
                dateRangePickerHelper.datePickerValueToDateString(
                  nextDateRange,
                ),
              )
            }
          />
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
