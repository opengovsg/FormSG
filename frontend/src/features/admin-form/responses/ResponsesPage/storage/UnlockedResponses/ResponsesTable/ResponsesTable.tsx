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
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_REMINDERS_LABEL,
  MRF_RESPONSE_TIMESTAMP_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'

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

// Column width presets - shirt sizes for table columns
const COLUMN_SIZES = {
  xs: { width: 80, minWidth: 60, maxWidth: 100 }, // Tiny columns like "#"
  sm: { width: 120, minWidth: 100, maxWidth: 150 }, // Small columns like "Status"
  md: { width: 180, minWidth: 120, maxWidth: 250 }, // Medium columns like "Email"
  lg: { width: 250, minWidth: 200, maxWidth: 350 }, // Large columns like "Timestamp"
  xl: { width: 300, minWidth: 200, maxWidth: 400 }, // Extra large like "Response ID"
}

// Helper function to create column width config
const columnWidth = (
  size: keyof typeof COLUMN_SIZES,
  options?: {
    disableResizing?: boolean
    customWidth?: number
    minWidth?: number
    maxWidth?: number
  },
) => ({
  ...COLUMN_SIZES[size],
  ...options,
  ...(options?.customWidth && { width: options.customWidth }),
})
const BASE_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: 'number',
    ...columnWidth('xs'),
  },
  {
    Header: 'Response ID',
    accessor: 'refNo',
    ...columnWidth('xl'),
  },
  {
    Header: 'Timestamp',
    accessor: 'submissionTime',
    ...columnWidth('lg', { disableResizing: true }),
  },
]

const PAYMENT_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: 'Email',
    accessor: ({ payments }) => {
      if (!payments?.email) {
        return ''
      }
      return payments.email
    },
    ...columnWidth('md'),
  },

  {
    Header: 'Paid Amount (S$)', //  (amt responder paid)
    accessor: ({ payments }) => {
      if (!payments) {
        return ''
      }
      return `${centsToDollars(payments.paymentAmt)}`
    },
    ...columnWidth('sm'),
  },

  {
    Header: 'Fees (S$)', //  (paid - net)
    accessor: ({ payments }) => {
      if (!payments?.transactionFee) {
        return ''
      }
      if (payments.transactionFee < 0) {
        return ''
      }

      return `${centsToDollars(payments.transactionFee)}`
    },
    ...columnWidth('sm', { customWidth: 100 }),
  },

  {
    Header: 'Net Amount (S$)', //  (amt they receive in bank)
    accessor: ({ payments }) => getNetAmount(payments),
    ...columnWidth('sm'),
  },

  {
    Header: 'Payout Date',
    accessor: ({ payments }) => {
      if (!payments) {
        return 'Pending'
      }
      return payments.payoutDate
    },
    ...columnWidth('md', { customWidth: 150, disableResizing: true }),
  },
]

const MRF_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: 'number',
    ...columnWidth('xs', { customWidth: 60, minWidth: 40 }),
  },
  {
    Header: 'Response ID',
    accessor: 'refNo',
    ...columnWidth('md', { customWidth: 160, minWidth: 100, maxWidth: 240 }),
  },
  {
    Header: MRF_WORKFLOW_STATUS_LABEL,
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
    ...columnWidth('sm', { minWidth: 90, maxWidth: 160 }),
  },
  {
    Header: MRF_PENDING_RESPONSE_AT_LABEL,
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
    ...columnWidth('md', { customWidth: 140, maxWidth: 180 }),
  },
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    accessor: 'submissionTime',
    ...columnWidth('md', { minWidth: 140, maxWidth: 240 }),
  },
  {
    Header: MRF_REMINDERS_LABEL,
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
    ...columnWidth('md'),
  },
]
const PAYMENT_RESPONSE_TABLE_COLUMNS =
  BASE_RESPONSE_TABLE_COLUMNS.concat(PAYMENT_COLUMNS)

export const ResponsesTable = () => {
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
      return MRF_RESPONSE_TABLE_COLUMNS
    }
    if (isPaymentsForm) {
      return PAYMENT_RESPONSE_TABLE_COLUMNS
    }
    return BASE_RESPONSE_TABLE_COLUMNS
  }, [isMultiRespondentForm, isPaymentsForm])

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
      minW="fit-content" // Let table be its natural width based on columns
      w="100%"
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
                minW={0} // Allow header to shrink but not overlap
                flexShrink={0} // Prevent headers from shrinking below their minWidth
                overflow="hidden" // Prevent content from overflowing
              >
                <Flex align="center">{column.render('Header')}</Flex>

                {column.disableResizing ? null : (
                  <Flex
                    {...column.getResizerProps()}
                    justify="center"
                    top={0}
                    right={0}
                    zIndex={2}
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
              minWidth="100%"
              display="flex"
              role="group" // ✨ Add this to make parent hoverable
            >
              {row.cells.map((cell) => {
                return (
                  <Td
                    as="div"
                    {...cell.getCellProps()}
                    key={cell.getCellProps().key}
                    display="flex"
                    alignItems="center"
                    minW={0}
                    flexShrink={0}
                    overflow="hidden"
                    _groupHover={{
                      bg: 'primary.100', // ✨ Hover on row affects all cells
                    }}
                    _active={{
                      bg: 'primary.200',
                    }}
                    transition="background 0.15s ease" // ✨ Smooth transition
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
