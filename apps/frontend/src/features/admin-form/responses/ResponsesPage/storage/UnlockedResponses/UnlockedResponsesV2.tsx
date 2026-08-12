import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Flex,
  Grid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { BasicField, FormFieldDto } from 'formsg-shared/types'

import {
  DateRangePicker,
  dateRangePickerHelper,
} from '~components/DateRangePicker'
import Pagination from '~components/Pagination'

import { useAdminForm } from '~features/admin-form/common/queries'
import {
  MRF_RESPONSE_TIMESTAMP_LABEL,
  RESPONSE_ID_LABEL,
} from '~features/admin-form/responses/constants'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import { useDecryptedResponsesQuery } from '../useDecryptedResponsesQuery'

import {
  RESPONSES_TABLE_V2_PAGE_SIZE,
  ResponsesTableV2,
} from './ResponsesTable/ResponsesTableV2'
import { DownloadButton } from './DownloadButton'
import { SubmissionSearchbar } from './SubmissionSearchbar'
import { useUnlockedResponses } from './UnlockedResponsesProvider'

// Cap on responses the dashboard will decrypt/render in one date range; kept
// low as the table is not virtualised yet.
const RESPONSES_DASHBOARD_MAX_RESPONSE_COUNT = 1000

// Field types with no meaningful single-cell answer, excluded as columns.
const DASHBOARD_EXCLUDED_FIELD_TYPES = new Set<BasicField>([
  BasicField.Section,
  BasicField.Statement,
  BasicField.Signature,
  BasicField.Attachment,
  BasicField.Image,
  BasicField.Address,
  BasicField.Children,
])

const filterFieldsForDashboardView = (formFields: FormFieldDto[]) =>
  formFields.filter(
    (field) => !DASHBOARD_EXCLUDED_FIELD_TYPES.has(field.fieldType),
  )

// Always-shown meta columns; `_id` must match the column Header in
// ResponsesTableV2.
const getSubmissionMetaFieldsForDashboard = (): {
  _id: string
  title: string
}[] => [
  {
    _id: RESPONSE_ID_LABEL,
    title: RESPONSE_ID_LABEL,
  },
  {
    _id: MRF_RESPONSE_TIMESTAMP_LABEL,
    title: 'Response Timestamp',
  },
]

export const UnlockedResponsesV2 = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { data: form, isLoading: isLoadingForm } = useAdminForm()
  const {
    secretKey,
    isLoading: isLoadingSecretKey,
    dateRange,
    setDateRange,
    dateRangeResponsesCount,
  } = useStorageResponsesContext()
  const {
    count,
    filteredCount,
    currentPage,
    setCurrentPage,
    submissionId,
    setSubmissionId,
    isAnyFetching,
  } = useUnlockedResponses()
  const [startDate, endDate] = dateRange

  const responsesCount = dateRangeResponsesCount ?? 0
  const isOverResponseCap =
    responsesCount > RESPONSES_DASHBOARD_MAX_RESPONSE_COUNT

  const { data: decryptedResponses = [], isFetching: isFetchingAndDecrypting } =
    useDecryptedResponsesQuery({
      formId: form?._id ?? '',
      secretKey: secretKey ?? '',
      startDate,
      endDate,
      // Decrypting the working set is expensive, so never start over the cap
      // (or when there is nothing to decrypt).
      enabled:
        !isLoadingForm &&
        !isLoadingSecretKey &&
        !!secretKey &&
        !!form &&
        !isOverResponseCap &&
        responsesCount > 0,
    })

  // Narrow to the searched response ID, if any.
  const responsesToDisplay = useMemo(
    () =>
      submissionId
        ? decryptedResponses.filter(
            (response) => response.refNo === submissionId,
          )
        : decryptedResponses,
    [decryptedResponses, submissionId],
  )

  const countToUse = submissionId ? filteredCount : count

  if (!secretKey || !form) return null

  const submissionMetaFields = getSubmissionMetaFieldsForDashboard()
  const fieldsForDashboardView = filterFieldsForDashboardView(
    form.form_fields ?? [],
  )

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
        {isOverResponseCap ? (
          <Container p={0} maxW="42.5rem">
            <Stack spacing="1rem" align="center" py="4rem">
              <Text as="h2" color="primary.500" textStyle="h2">
                {t(
                  'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.tooManyResponsesTitle',
                )}
              </Text>
              <Text textStyle="body-1" color="secondary.500">
                {t(
                  'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.tooManyResponsesBody',
                  { responseCount: responsesCount.toLocaleString() },
                )}
              </Text>
            </Stack>
          </Container>
        ) : isFetchingAndDecrypting ? (
          <Skeleton height="2.5rem" />
        ) : (
          <ResponsesTableV2
            selectedSubmissionMetaFields={submissionMetaFields}
            selectedFields={fieldsForDashboardView}
            decryptedResponses={responsesToDisplay}
          />
        )}
      </Box>

      <Box
        display={
          isOverResponseCap ||
          isFetchingAndDecrypting ||
          responsesToDisplay.length === 0
            ? 'none'
            : ''
        }
      >
        <Pagination
          totalCount={responsesToDisplay.length}
          currentPage={currentPage ?? 1} //1-indexed
          pageSize={RESPONSES_TABLE_V2_PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </Box>
    </Flex>
  )
}
