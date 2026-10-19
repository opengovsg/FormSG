import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Skeleton, Text } from '@chakra-ui/react'

import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { DeleteViewModal } from './DeleteViewModal'
import { DownloadButton } from './DownloadButton'
import { TABLE_RESPONSE_LIMIT } from './responseLimit'
import { ResponsesTable } from './ResponsesTable'
import { ResponsesToolbar } from './ResponsesToolbar'
import { ResponseViewTabs } from './ResponseViewTabs'
import { ShowMoreRowsButton } from './ShowMoreRowsButton'
import { SubmissionSearchbar } from './SubmissionSearchbar'
import {
  ALL_RESPONSES_VIEW_ID,
  useUnlockedResponses,
} from './UnlockedResponsesProvider'
import { useDeleteSavedViewMutation } from './useSavedViewMutation'

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
    filterResultCount,
    savedViews,
    selectedViewId,
    isShowingRecentOnly,
    hasActiveFilters,
    applyView,
  } = useUnlockedResponses()

  const [viewPendingDelete, setViewPendingDelete] = useState<string>()
  const deleteSavedViewMutation = useDeleteSavedViewMutation()

  const handleDeleteView = useCallback(() => {
    if (!viewPendingDelete) return
    deleteSavedViewMutation.mutate(viewPendingDelete, {
      onSuccess: () => {
        // The applied view is gone, so the table falls back to every response.
        if (viewPendingDelete === selectedViewId)
          applyView(ALL_RESPONSES_VIEW_ID)
        setViewPendingDelete(undefined)
      },
    })
  }, [applyView, deleteSavedViewMutation, selectedViewId, viewPendingDelete])

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
        <Skeleton
          isLoaded={!isAnyFetching}
          w={isAnyFetching ? '15rem' : { base: '100%', md: 'auto' }}
          maxW="100%"
        >
          <Text
            textStyle="h4"
            mb={{ base: '0.25rem', md: '0.5rem' }}
            noOfLines={{ base: 2, md: 1 }}
          >
            <Text as="span" color="primary.500">
              {(filterResultCount ?? countToUse)?.toLocaleString()}
            </Text>{' '}
            {t(
              filterResultCount !== undefined
                ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.resultsFound'
                : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.responsesToDate',
              { count: filterResultCount ?? countToUse ?? 0 },
            )}
          </Text>
          {isShowingRecentOnly ? (
            <Text textStyle="body-2" color="secondary.400">
              {t(
                hasActiveFilters
                  ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.recentOnlyWithView'
                  : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.recentOnly',
                { limit: TABLE_RESPONSE_LIMIT.toLocaleString() },
              )}
            </Text>
          ) : null}
        </Skeleton>
      </Flex>

      <ResponseViewTabs
        views={savedViews.map(({ _id, name }) => ({ id: _id, name }))}
        selectedViewId={selectedViewId}
        onSelectView={applyView}
        onDeleteView={setViewPendingDelete}
      />

      <DeleteViewModal
        isOpen={!!viewPendingDelete}
        onClose={() => setViewPendingDelete(undefined)}
        onDelete={handleDeleteView}
        isLoading={deleteSavedViewMutation.isLoading}
        viewName={
          savedViews.find(({ _id }) => _id === viewPendingDelete)?.name ?? ''
        }
      />

      <ResponsesToolbar />

      <Flex direction="column" gap="1rem" mb="3rem" w="100%" minW={0}>
        {/* No overflow here: the table scrolls its own body sideways, and an
            overflowing ancestor would capture its sticky header. */}
        <Box w="100%" minW={0} maxW="100%">
          <ResponsesTable />
        </Box>
        <ShowMoreRowsButton />
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

      <ResponseViewTabs />

      <Flex
        direction={{ base: 'column', lg: 'row' }}
        align={{ base: 'stretch', lg: 'center' }}
        justify="space-between"
        gap="0.75rem"
        w="100%"
        maxW="100%"
        mb="1rem"
        flexShrink={0}
      >
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align={{ base: 'stretch', sm: 'center' }}
          gap="0.75rem"
          flex={1}
          minW={0}
        >
          <Flex flexShrink={0}>
            <SubmissionSearchbar
              submissionId={submissionId}
              setSubmissionId={setSubmissionId}
              isAnyFetching={isAnyFetching}
            />
          </Flex>
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
        </Flex>
        <DownloadButton />
      </Flex>

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
