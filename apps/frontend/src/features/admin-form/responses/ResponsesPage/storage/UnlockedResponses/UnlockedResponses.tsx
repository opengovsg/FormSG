import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Text } from '@chakra-ui/react'

import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { useResultsNavLayout } from '../../../components/FormResultsNavbar'
import { useStorageResponsesContext } from '../StorageResponsesContext'

import { DashboardVersionToggle } from './DashboardVersionToggle'
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
  type ResponseCountState,
  useUnlockedResponses,
} from './UnlockedResponsesProvider'
import { useDeleteSavedViewMutation } from './useSavedViewMutation'

export const UnlockedResponses = (): JSX.Element => {
  const isDelightfulDashboard = useIsDelightfulDashboard()

  if (!isDelightfulDashboard) return <LegacyUnlockedResponses />

  return <DelightfulUnlockedResponses />
}

const DelightfulUnlockedResponses = (): JSX.Element => {
  const { contentPr } = useResultsNavLayout('1rem')
  const { t } = useTranslation()

  const {
    responseCountState,
    submissionId,
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

  return (
    <Flex flexDir="column" pr={contentPr} w="100%" maxW="100%" minW={0}>
      <Flex align="center" gap="1rem" mb="1rem">
        <Box flex={1} minW={0}>
          <ResponseViewTabs
            countState={responseCountState}
            views={savedViews.map(({ _id, name }) => ({ id: _id, name }))}
            selectedViewId={selectedViewId}
            onSelectView={applyView}
            onDeleteView={setViewPendingDelete}
          />
        </Box>
        <DashboardVersionToggle />
      </Flex>

      {isShowingRecentOnly ? (
        <Text textStyle="body-2" color="secondary.400" mb="1rem">
          {t(
            hasActiveFilters
              ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.recentOnlyWithView'
              : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.recentOnly',
            { limit: TABLE_RESPONSE_LIMIT.toLocaleString() },
          )}
        </Text>
      ) : null}

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
          {responseCountState.status === 'ready' &&
          responseCountState.count === 0 &&
          (submissionId || hasActiveFilters) ? (
            <Text
              textStyle="body-1"
              color="secondary.500"
              textAlign="center"
              py="2rem"
              role="status"
            >
              {t(
                'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.noMatchingResponses',
              )}
            </Text>
          ) : null}
        </Box>
        <ShowMoreRowsButton />
      </Flex>
    </Flex>
  )
}

const LegacyUnlockedResponses = (): JSX.Element => {
  const { contentPr } = useResultsNavLayout('1rem')

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

  const countState: ResponseCountState =
    isAnyFetching || countToUse === undefined
      ? { status: 'loading' }
      : { status: 'ready', count: countToUse }

  const { dateRange, setDateRange } = useStorageResponsesContext()

  return (
    <Flex flexDir="column" pr={contentPr} w="100%" maxW="100%" minW={0}>
      <Flex align="center" gap="1rem" mb="1rem">
        <Box flex={1} minW={0}>
          <ResponseViewTabs countState={countState} />
        </Box>
        <DashboardVersionToggle />
      </Flex>

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
