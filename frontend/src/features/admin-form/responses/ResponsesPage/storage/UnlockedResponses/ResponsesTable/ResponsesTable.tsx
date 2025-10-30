import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Column,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useTable,
} from 'react-table'
import {
  BadgeProps,
  Flex,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import {
  FormResponseMode,
  SubmissionMetadata,
  WorkflowStatus,
} from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import Badge from '~components/Badge'

import { useAdminForm } from '~features/admin-form/common/queries'
import { getPendingResponseAtString } from '~features/admin-form/responses/common/utils/mrfSubmissionView'

import { useUnlockedResponses } from '../UnlockedResponsesProvider'

import { SendReminderButton } from './SendReminderButton'
import { getNetAmount } from './utils'

type ResponseColumnData = SubmissionMetadata

const StatusBadge = ({
  textColor,
  backgroundColor,
  statusText,
}: {
  textColor: BadgeProps['textColor']
  backgroundColor: BadgeProps['backgroundColor']
  statusText: string
}) => (
  <Badge
    width="fit-content"
    display="flex"
    textColor={textColor}
    textStyle="caption-1"
    backgroundColor={backgroundColor}
  >
    {statusText}
  </Badge>
)

function PendingBadge() {
  const { t } = useTranslation()
  return (
    <StatusBadge
      textColor="warning.700"
      backgroundColor="warning.100"
      statusText={t('features.common.pending')}
    />
  )
}

function PayoutPendingText() {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.responsesPage',
  })
  return t('storage.unlockedResponses.responsesTable.status.payoutPending')
}

function CompletedBadge() {
  const { t } = useTranslation()
  return (
    <StatusBadge
      textColor="success.700"
      backgroundColor="success.100"
      statusText={t('features.common.completed')}
    />
  )
}

function ApprovedBadge() {
  const { t } = useTranslation()
  return (
    <StatusBadge
      textColor="success.700"
      backgroundColor="success.100"
      statusText={t('features.common.approved')}
    />
  )
}

function NotApprovedBadge() {
  const { t } = useTranslation()
  return (
    <StatusBadge
      textColor="danger.700"
      backgroundColor="danger.100"
      statusText={t('features.common.notApproved')}
    />
  )
}

// Helper function to create base columns with translations
const createBaseColumns = (t: (key: string) => string): Column<ResponseColumnData>[] => [
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.number'),
    accessor: 'number',
    width: 80,
    minWidth: 80,
    maxWidth: 100,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.responseId'),
    accessor: 'refNo',
    width: 300,
    minWidth: 300,
    maxWidth: 300,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.timestamp'),
    accessor: 'submissionTime',
    width: 250,
    minWidth: 250,
    disableResizing: true,
  },
]

// Helper function to create payment columns with translations
const createPaymentColumns = (t: (key: string) => string): Column<ResponseColumnData>[] => [
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.email'),
    accessor: ({ payments }) => {
      if (!payments?.email) {
        return ''
      }
      return payments.email
    },
    minWidth: 250,
    width: 250,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.paidAmount'),
    accessor: ({ payments }) => {
      if (!payments) {
        return ''
      }
      return `${centsToDollars(payments.paymentAmt)}`
    },
    minWidth: 150,
    width: 150,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.fees'),
    accessor: ({ payments }) => {
      if (!payments?.transactionFee) {
        return ''
      }
      if (payments.transactionFee < 0) {
        return ''
      }
      return `${centsToDollars(payments.transactionFee)}`
    },
    minWidth: 150,
    width: 150,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.netAmount'),
    accessor: ({ payments }) => getNetAmount(payments),
    minWidth: 150,
    width: 150,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.payoutDate'),
    accessor: ({ payments }) => {
      if (!payments) {
        return <PayoutPendingText />
      }
      return payments.payoutDate
    },
    minWidth: 200,
    width: 200,
    disableResizing: true,
  },
]

// Helper function to create MRF columns with translations
const createMrfColumns = (t: (key: string) => string): Column<ResponseColumnData>[] => [
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.number'),
    accessor: 'number',
    width: 80,
    minWidth: 80,
    maxWidth: 100,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.headers.responseId'),
    accessor: 'refNo',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.mrf.workflowStatus'),
    accessor: ({ mrf }) => {
      if (!mrf?.workflowStatus) {
        return ''
      }
      if (mrf.workflowStatus === WorkflowStatus.PENDING) {
        return <PendingBadge />
      }
      if (mrf.workflowStatus === WorkflowStatus.APPROVED) {
        return <ApprovedBadge />
      }
      if (mrf.workflowStatus === WorkflowStatus.REJECTED) {
        return <NotApprovedBadge />
      }
      if (mrf.workflowStatus === WorkflowStatus.COMPLETED) {
        return <CompletedBadge />
      }
    },
    width: 160,
    minWidth: 160,
    maxWidth: 160,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.mrf.pendingResponseAt'),
    accessor: ({ mrf }) => {
      const workflowStatus = mrf?.workflowStatus
      const workflowCurrentStepNumber = mrf?.workflowCurrentStepNumber
      const workflowNumTotalSteps = mrf?.workflowNumTotalSteps
      if (
        workflowStatus === undefined ||
        workflowCurrentStepNumber === undefined ||
        workflowNumTotalSteps === undefined
      ) {
        return ''
      }
      return getPendingResponseAtString({
        workflowStatus,
        workflowCurrentStepNumber,
        workflowNumTotalSteps,
      })
    },
    width: 180,
    minWidth: 180,
    maxWidth: 180,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.mrf.responseTimestamp'),
    accessor: 'submissionTime',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
  },
  {
    Header: t('storage.unlockedResponses.responsesTable.mrf.reminders'),
    Cell: ({ row }) => {
      const isPending =
        row.original.mrf?.workflowStatus === WorkflowStatus.PENDING
      const hasNextStepRecipientEmails =
        row.original.mrf?.hasNextStepRecipientEmails
      const submissionId = row.original.refNo
      return isPending && hasNextStepRecipientEmails ? (
        <SendReminderButton submissionId={submissionId} />
      ) : null
    },
    minWidth: 160,
    width: 160,
  },
]

export const ResponsesTable = () => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.responsesPage',
  })
  const { data: form } = useAdminForm()
  const isPaymentsForm =
    form?.responseMode === FormResponseMode.Encrypt
      ? form.payments_field.enabled
      : false
  const isMultiRespondentForm =
    form?.responseMode === FormResponseMode.Multirespondent

  const {
    currentPage: currentPage1Indexed,
    metadata,
    filteredMetadata,
    submissionId,
    onRowClick,
  } = useUnlockedResponses()

  const navigate = useNavigate()

  const currentPage = useMemo(
    () => (currentPage1Indexed ?? 1) - 1,
    [currentPage1Indexed],
  )

  const metadataToUse = useMemo(() => {
    if (submissionId) {
      return filteredMetadata
    } else {
      return metadata
    }
  }, [filteredMetadata, metadata, submissionId])

  const columns = useMemo(() => {
    if (isMultiRespondentForm) {
      return createMrfColumns(t)
    }
    if (isPaymentsForm) {
      return createBaseColumns(t).concat(createPaymentColumns(t))
    }
    return createBaseColumns(t)
  }, [isMultiRespondentForm, isPaymentsForm, t])

  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
  } = useTable<ResponseColumnData>(
    {
      columns,
      data: metadataToUse,
      // Server side pagination.
      manualPagination: true,
      pageCount: currentPage,
      initialState: {
        pageIndex: currentPage,
        pageSize: 10,
      },
    },
    usePagination,
    useResizeColumns,
    useFlexLayout,
  )

  useEffect(() => {
    gotoPage(currentPage)
  }, [currentPage, gotoPage])

  const handleRowClick = useCallback(
    (submissionId: string, responseNumber: number) => {
      onRowClick()
      return navigate(submissionId, {
        state: {
          responseNumber,
        },
      })
    },
    [navigate, onRowClick],
  )

  return (
    <Table
      as="div"
      variant="solid"
      colorScheme="secondary"
      {...getTableProps()}
    >
      <Thead as="div" pos="sticky" top={0}>
        {headerGroups.map((headerGroup) => (
          <Tr
            as="div"
            {...headerGroup.getHeaderGroupProps()}
            key={headerGroup.getHeaderGroupProps().key}
            // To toggle _groupHover styles to show divider when header is hovered.
            data-group
          >
            {headerGroup.headers.map((column) => (
              <Th
                as="div"
                pos="relative"
                {...column.getHeaderProps()}
                key={column.getHeaderProps().key}
              >
                <Flex align="center">{column.render('Header')}</Flex>

                {column.disableResizing ? null : (
                  <Flex
                    {...column.getResizerProps()}
                    justify="center"
                    top={0}
                    right={0}
                    zIndex={1}
                    transitionProperty="background"
                    transitionDuration="normal"
                    pos="absolute"
                    h="100%"
                    borderX="8px solid"
                    borderColor="secondary.500"
                    _hover={{
                      bg: column.isResizing ? 'white' : 'secondary.200',
                    }}
                    _groupHover={{
                      bg: column.isResizing ? 'white' : 'secondary.300',
                      _hover: {
                        bg: column.isResizing ? 'white' : 'secondary.200',
                      },
                    }}
                    w="17px"
                    sx={{
                      touchAction: 'none',
                    }}
                  />
                )}
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody as="div" {...getTableBodyProps()}>
        {page.map((row) => {
          prepareRow(row)
          return (
            <Tr
              as="div"
              {...row.getRowProps()}
              key={row.getRowProps().key}
              px={0}
              onClick={() =>
                handleRowClick(row.values.refNo, row.values.number)
              }
              cursor="pointer"
              _hover={{
                bg: 'primary.100',
              }}
              _active={{
                bg: 'primary.200',
              }}
            >
              {row.cells.map((cell) => {
                return (
                  <Td
                    as="div"
                    {...cell.getCellProps()}
                    key={cell.getCellProps().key}
                    display="flex"
                    alignItems="center"
                  >
                    {cell.render('Cell')}
                  </Td>
                )
              })}
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}
