import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex, Skeleton, Spinner, Stack, Text } from '@chakra-ui/react'

import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { useStorageResponsesContext } from '../StorageResponsesContext'

import { useInfiniteScrollTrigger } from './hooks/useInfiniteScrollTrigger'
import { DeleteViewModal } from './DeleteViewModal'
import { DownloadButton } from './DownloadButton'
import { TABLE_RESPONSE_LIMIT } from './responseLimit'
import { ResponsesTable } from './ResponsesTable'
import { ResponsesToolbar } from './ResponsesToolbar'
import { ResponseViewTabs } from './ResponseViewTabs'
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
    searchResultCount,
    isTableLoading,
    savedViews,
    selectedViewId,
    isShowingRecentOnly,
    hasActiveFilters,
    applyView,
    renderLimit,
    showMoreRows,
    renderedRowCount,
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

  const hasMoreRowsToRender = renderedRowCount >= renderLimit

  const sentinelRef = useInfiniteScrollTrigger<HTMLDivElement>({
    onTrigger: showMoreRows,
    enabled: !isTableLoading && hasMoreRowsToRender,
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
              {(searchResultCount ?? countToUse)?.toLocaleString()}
            </Text>{' '}
            {t(
              searchResultCount !== undefined
                ? 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.resultsFound'
                : 'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.responsesToDate',
              { count: searchResultCount ?? countToUse ?? 0 },
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
        {hasMoreRowsToRender ? (
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
    <Flex
      flexDir="column"
      pr={{ base: '1rem', md: '1.75rem', lg: '2rem' }}
      w="100%"
      maxW="69.5rem"
      mx="auto"
      minW={0}
      overflowX="hidden"
    >
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        mb="1rem"
        alignItems={{ base: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        color="secondary.500"
        gap="1rem"
        w="100%"
        maxW="100%"
        flexWrap="wrap"
        flexShrink={0}
      >
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
