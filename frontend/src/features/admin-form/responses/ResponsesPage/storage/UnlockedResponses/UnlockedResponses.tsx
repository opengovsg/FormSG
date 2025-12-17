import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Skeleton, Stack, Text } from '@chakra-ui/react'

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
    <Flex
      flexDir="column"
      pr={{ base: '1rem', md: '1.75rem', lg: '2rem' }} // Reduce padding on mobile
      w="100%"
      maxW="100%" // IMPORTANT: Never exceed screen width
      minW={0}
      overflowX="hidden" // IMPORTANT: Don't let this container scroll horizontally
    >
      {/* On small screens: stacked (3 rows), On larger screens: horizontal */}
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        mb="1rem"
        alignItems={{ base: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        color="secondary.500"
        gap="1rem"
        w="100%"
        maxW="100%" // IMPORTANT: Don't exceed parent width
        flexWrap="wrap" // ADD THIS: Let items wrap on small screens if needed
        flexShrink={0}
      >
        {/* Row 1: Responses count on left, Search icon on right */}
        <Flex
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          w={{ base: '100%', sm: 'auto' }}
          flex={{ base: '0 0 auto', sm: '1' }}
          minW={0}
        >
          <Flex direction="column" flex={1} minW={0}>
            <Skeleton
              isLoaded={!isAnyFetching}
              w={{ base: '100%', md: 'auto' }}
            >
              <Text
                textStyle="h4"
                mb={{ base: '0.25rem', md: '0.5rem' }}
                noOfLines={{ base: 2, md: 1 }}
              >
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
          </Flex>

          <Flex minW="fit-content" flexShrink={0} ml={{ base: '1rem', sm: 0 }}>
            <SubmissionSearchbar
              submissionId={submissionId}
              setSubmissionId={setSubmissionId}
              isAnyFetching={isAnyFetching}
            />
          </Flex>
        </Flex>

        {/* Combined: Works on both mobile and desktop */}
        <Stack
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'stretch', sm: 'flex-end' }}
          spacing="0.5rem"
          w={{ base: '100%', sm: 'auto' }}
          flexShrink={0}
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
      </Flex>
      <Box
        mb="3rem"
        overflowX="auto" // This allows horizontal scrolling
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
      <Box
        display={isLoading || countToUse === 0 ? 'none' : ''}
        w="100%"
        maxW="100%"
        flexShrink={0}
        pt={{ base: '1rem', md: '0' }}
        pb={{ base: '1rem', md: '0' }}
      >
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
