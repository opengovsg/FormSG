import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Grid, Skeleton, Stack, Text } from '@chakra-ui/react'

import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { DownloadButton } from './DownloadButton'
import { ResponsesTable } from './ResponsesTable'
import { SubmissionSearchbar } from './SubmissionSearchbar'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

export const UnlockedResponses = (): JSX.Element => {
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
              {submissionId
                ? t(
                    'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.resultsFound',
                  )
                : t(
                    'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.responsesToDate',
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
