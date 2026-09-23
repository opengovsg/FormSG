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
  Skeleton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import {
  BasicField,
  FormResponseMode,
  SubmissionMetadata,
  WorkflowStatus,
} from 'formsg-shared/types'
import { centsToDollars } from 'formsg-shared/utils/payments'

import Badge from '~components/Badge'

import { useAdminForm } from '~features/admin-form/common/queries'
import { formatResponseForCell } from '~features/admin-form/responses/common/utils/formatResponseForCell'
import { getPendingResponseAtString } from '~features/admin-form/responses/common/utils/mrfSubmissionView'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_REMINDERS_LABEL,
  MRF_RESPONSE_TIMESTAMP_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'
import { useDecryptedResponsesBySubmissionId } from '~features/admin-form/responses/queries'

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

const BASE_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: 'number',
    width: 80, // width is used for both the flex-basis and flex-grow
    minWidth: 80, // minWidth is only used as a limit for resizing
    maxWidth: 100, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Response ID',
    accessor: 'refNo',
    width: 300,
    minWidth: 300,
    maxWidth: 300,
  },
  {
    Header: 'Timestamp',
    accessor: 'submissionTime',
    width: 250,
    minWidth: 250,
    disableResizing: true,
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
    minWidth: 250,
    width: 250,
  },

  {
    Header: 'Paid Amount (S$)', //  (amt responder paid)
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
    minWidth: 150,
    width: 150,
  },

  {
    Header: 'Net Amount (S$)', //  (amt they receive in bank)
    accessor: ({ payments }) => getNetAmount(payments),
    minWidth: 150,
    width: 150,
  },

  {
    Header: 'Payout Date',
    accessor: ({ payments }) => {
      if (!payments) {
        return 'Pending'
      }
      return payments.payoutDate
    },
    minWidth: 200,
    width: 200,
    disableResizing: true,
  },
]

const MRF_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: 'number',
    width: 80,
    minWidth: 80,
    maxWidth: 100,
  },
  {
    Header: 'Response ID',
    accessor: 'refNo',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
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
    width: 160,
    minWidth: 160,
    maxWidth: 160,
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
    width: 180,
    minWidth: 180,
    maxWidth: 180,
  },
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    accessor: 'submissionTime',
    // TODO(FRM-1933): using submissionTime as we are undecided on showing first submission vs lastSubmittedAt
    // accessor: ({ mrf }) =>
    //   mrf?.lastSubmittedAt
    //     ? formatInTimeZone(
    //         mrf.lastSubmittedAt,
    //         'Asia/Singapore',
    //         'do MMM yyyy, hh:mm:ss a',
    //       )
    //     : '',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
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
    minWidth: 160,
    width: 160,
  },
]

const PAYMENT_RESPONSE_TABLE_COLUMNS =
  BASE_RESPONSE_TABLE_COLUMNS.concat(PAYMENT_COLUMNS)

const WORKFLOW_PREFIX_COLUMNS = MRF_RESPONSE_TABLE_COLUMNS

const NO_WORKFLOW_PREFIX_COLUMNS: Column<ResponseColumnData>[] = [
  BASE_RESPONSE_TABLE_COLUMNS[0],
  BASE_RESPONSE_TABLE_COLUMNS[1],
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    accessor: 'submissionTime',
    width: 250,
    minWidth: 250,
    disableResizing: true,
  },
]

const RESPONSE_NUMBER_COLUMN_ID = 'number'

// react-table derives an id from an explicit id, then a string accessor, then
// a string Header.
const getColumnId = (column: Column<ResponseColumnData>): string =>
  column.id ??
  (typeof column.accessor === 'string' ? column.accessor : undefined) ??
  String(column.Header)

const NON_ANSWERABLE_FIELD_TYPES = new Set<BasicField>([
  BasicField.Section,
  BasicField.Statement,
  BasicField.Image,
])

export const ResponsesTable = () => {
  const { data: form } = useAdminForm()
  const isPaymentsForm =
    form?.responseMode === FormResponseMode.Encrypt
      ? form.payments_field.enabled
      : false
  const isMultiRespondentForm =
    form?.responseMode === FormResponseMode.Multirespondent
  const hasWorkflow =
    form?.responseMode === FormResponseMode.Multirespondent &&
    form.workflow.length > 0

  const {
    currentPage: currentPage1Indexed,
    metadata,
    filteredMetadata,
    submissionId,
    onRowClick,
    isInfiniteScroll,
    setColumnOptions,
    hiddenColumnIds,
  } = useUnlockedResponses()
  const isDelightfulDashboard = useIsDelightfulDashboard()

  const { data: responsesBySubmissionId, isFetching: isDecrypting } =
    useDecryptedResponsesBySubmissionId({ enabled: isDelightfulDashboard })

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

  const legacyColumns = useMemo(() => {
    if (isMultiRespondentForm) {
      return MRF_RESPONSE_TABLE_COLUMNS
    }
    if (isPaymentsForm) {
      return PAYMENT_RESPONSE_TABLE_COLUMNS
    }
    return BASE_RESPONSE_TABLE_COLUMNS
  }, [isMultiRespondentForm, isPaymentsForm])

  const answerableFields = useMemo(() => {
    if (!isDelightfulDashboard || !form) return []
    return form.form_fields.filter(
      (formField) => !NON_ANSWERABLE_FIELD_TYPES.has(formField.fieldType),
    )
  }, [form, isDelightfulDashboard])

  const prefixColumns = useMemo(() => {
    if (hasWorkflow) return WORKFLOW_PREFIX_COLUMNS
    return isPaymentsForm
      ? NO_WORKFLOW_PREFIX_COLUMNS.concat(PAYMENT_COLUMNS)
      : NO_WORKFLOW_PREFIX_COLUMNS
  }, [hasWorkflow, isPaymentsForm])

  const fieldColumns = useMemo((): Column<ResponseColumnData>[] => {
    return answerableFields.map((formField) => ({
      id: formField._id,
      Header: formField.title,
      accessor: ({ refNo }: ResponseColumnData) => {
        const responses = responsesBySubmissionId?.get(refNo)
        if (!responses) return undefined
        return formatResponseForCell(
          responses.find((response) => response._id === formField._id),
        )
      },
      Cell: ({ value }: { value?: string }) => (
        <Skeleton isLoaded={value !== undefined || !isDecrypting} w="100%">
          <Text noOfLines={1} title={value}>
            {value ?? ''}
          </Text>
        </Skeleton>
      ),
      width: 200,
      minWidth: 120,
      maxWidth: 400,
    }))
  }, [answerableFields, isDecrypting, responsesBySubmissionId])

  const columns = useMemo(() => {
    if (!isDelightfulDashboard) return legacyColumns
    return prefixColumns.concat(fieldColumns)
  }, [fieldColumns, isDelightfulDashboard, legacyColumns, prefixColumns])

  const columnOptions = useMemo(() => {
    if (!isDelightfulDashboard) return []
    return prefixColumns
      .map((column) => ({
        id: getColumnId(column),
        label: String(column.Header),
      }))
      .filter(({ id }) => id !== RESPONSE_NUMBER_COLUMN_ID)
      .concat(
        answerableFields.map((formField) => ({
          id: formField._id,
          label: formField.title,
        })),
      )
  }, [answerableFields, isDelightfulDashboard, prefixColumns])

  useEffect(() => {
    setColumnOptions(columnOptions)
  }, [columnOptions, setColumnOptions])

  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    rows,
    gotoPage,
    setHiddenColumns,
  } = useTable<ResponseColumnData>(
    {
      columns,
      data: metadataToUse,
      // The columns array is rebuilt as answers decrypt; without this the
      // reset would undo the admin's column choices every few hundred ms.
      autoResetHiddenColumns: false,
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
    if (isInfiniteScroll) return
    gotoPage(currentPage)
  }, [currentPage, gotoPage, isInfiniteScroll])

  useEffect(() => {
    if (!isDelightfulDashboard) return
    setHiddenColumns(hiddenColumnIds)
  }, [hiddenColumnIds, isDelightfulDashboard, setHiddenColumns])

  const visibleRows = isInfiniteScroll ? rows : page

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
      {...(isDelightfulDashboard ? { minW: 'fit-content', w: '100%' } : {})}
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
                {...(isDelightfulDashboard
                  ? { minW: 0, flexShrink: 0, overflow: 'hidden' }
                  : {})}
              >
                <Flex align="center">{column.render('Header')}</Flex>

                {column.disableResizing ? null : (
                  <Flex
                    {...column.getResizerProps()}
                    justify="center"
                    top={0}
                    right={0}
                    zIndex={isDelightfulDashboard ? 2 : 1}
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
        {visibleRows.map((row) => {
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
              {...(isDelightfulDashboard
                ? { display: 'flex', minW: '100%', role: 'group' }
                : {
                    _hover: { bg: 'primary.100' },
                    _active: { bg: 'primary.200' },
                  })}
            >
              {row.cells.map((cell) => {
                return (
                  <Td
                    as="div"
                    {...cell.getCellProps()}
                    key={cell.getCellProps().key}
                    display="flex"
                    alignItems="center"
                    {...(isDelightfulDashboard
                      ? {
                          minW: 0,
                          flexShrink: 0,
                          overflow: 'hidden',
                          transitionProperty: 'background',
                          transitionDuration: 'normal',
                          _groupHover: { bg: 'primary.100' },
                          _groupActive: { bg: 'primary.200' },
                        }
                      : {})}
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
