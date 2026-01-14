import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BiChevronDown, BiFilterAlt, BiHide } from 'react-icons/bi'
import {
  Column,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useTable,
} from 'react-table'
import {
  BadgeProps,
  Box,
  Button,
  Flex,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import {
  AdminFormDto,
  FormResponseMode,
  SubmissionMetadata,
  WorkflowStatus,
} from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import Badge from '~components/Badge'

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

type ResponseColumnData = {
  decryptedResponses: FormField[]
} & SubmissionMetadata

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
    width: 50, // width is used for both the flex-basis and flex-grow
    minWidth: 50, // minWidth is only used as a limit for resizing
    maxWidth: 50, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Response ID',
    id: 'Response ID', // Must match the key used in search index
    accessor: 'refNo',
    width: 300,
    minWidth: 300,
    disableResizing: true,
  },
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    id: MRF_RESPONSE_TIMESTAMP_LABEL, // Must match the key used in search index
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
    width: 50,
    minWidth: 50,
    maxWidth: 50,
  },
  {
    Header: 'Response ID',
    id: 'Response ID', // Must match the key used in search index
    accessor: 'refNo',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
  },
  {
    Header: MRF_WORKFLOW_STATUS_LABEL,
    id: MRF_WORKFLOW_STATUS_LABEL, // Must match the key used in search index
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
    id: MRF_PENDING_RESPONSE_AT_LABEL, // Must match the key used in search index
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
    id: MRF_RESPONSE_TIMESTAMP_LABEL, // Must match the key used in search index
    accessor: 'submissionTime',
    width: 240,
    minWidth: 240,
    maxWidth: 240,
  },
  {
    Header: MRF_REMINDERS_LABEL,
    id: MRF_REMINDERS_LABEL, // Must match the key used in search index
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

const ColumnHeaderMenu = ({
  columnId,
  columnTitle,
  currentFilterValue,
  onHideColumn,
  onAddFilter,
  onRemoveFilter,
}: {
  columnId: string
  columnTitle: string
  currentFilterValue?: string
  onHideColumn: (fieldId: string) => void
  onAddFilter: (fieldId: string, value: string) => void
  onRemoveFilter?: (fieldId: string) => void
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [filterValue, setFilterValue] = useState(currentFilterValue || '')

  // Update local state when currentFilterValue changes
  useEffect(() => {
    setFilterValue(currentFilterValue || '')
  }, [currentFilterValue])

  const handleAddFilter = () => {
    if (filterValue.trim()) {
      onAddFilter(columnId, filterValue.trim())
      onClose()
    }
  }

  const handleRemoveFilter = () => {
    if (onRemoveFilter) {
      onRemoveFilter(columnId)
      setFilterValue('')
      onClose()
    }
  }

  const handleHide = () => {
    onHideColumn(columnId)
    onClose()
  }

  const hasActiveFilter = !!currentFilterValue

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="bottom-start"
    >
      <PopoverTrigger>
        <Flex
          align="center"
          cursor="pointer"
          _hover={{ color: 'primary.200' }}
          gap="0.25rem"
        >
          <Text>{columnTitle}</Text>
          {hasActiveFilter && <BiFilterAlt />}
          <BiChevronDown />
        </Flex>
      </PopoverTrigger>
      <Portal>
        <PopoverContent width="18rem" bg="white" zIndex="popover">
          <PopoverArrow />
          <PopoverBody p="0.75rem">
            <VStack align="stretch" spacing="0.5rem">
              <Button
                leftIcon={<BiHide />}
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                colorScheme="secondary"
                borderColor="secondary.200"
                onClick={handleHide}
              >
                Hide column
              </Button>
              <Box
                borderTop="1px solid"
                borderColor="secondary.200"
                pt="0.5rem"
              >
                <Text fontSize="xs" color="secondary.500" mb="0.25rem">
                  Filter by value {hasActiveFilter && '(active)'}
                </Text>
                <Flex gap="0.5rem">
                  <Input
                    size="sm"
                    placeholder="Contains..."
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddFilter()
                    }}
                    bg="white"
                    color="secondary.700"
                    borderColor={
                      hasActiveFilter ? 'primary.500' : 'secondary.300'
                    }
                    _placeholder={{ color: 'secondary.400' }}
                  />
                  <Button
                    size="sm"
                    colorScheme="primary"
                    leftIcon={<BiFilterAlt />}
                    onClick={handleAddFilter}
                    isDisabled={!filterValue.trim()}
                  >
                    {hasActiveFilter ? 'Update' : 'Filter'}
                  </Button>
                </Flex>
                {hasActiveFilter && onRemoveFilter && (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleRemoveFilter}
                    mt="0.25rem"
                    width="100%"
                  >
                    Remove filter
                  </Button>
                )}
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}

export const ResponsesTableV2 = ({
  form,
  selectedFields,
  selectedSubmissionMetaFields,
  decryptedResponses,
  isResponseLimitExceeded,
  onHideColumn,
  onAddFilter,
  onRemoveFilter,
  filters = [],
}: {
  form: AdminFormDto
  selectedFields: {
    _id: string
    title: string
  }[]
  selectedSubmissionMetaFields: {
    _id: string
    title: string
  }[]
  decryptedResponses: ({
    decryptedResponses: FormField[]
  } & SubmissionMetadata)[]
  isResponseLimitExceeded: boolean
  onHideColumn?: (fieldId: string) => void
  onAddFilter?: (fieldId: string, value: string) => void
  onRemoveFilter?: (fieldId: string) => void
  filters?: { fieldId: string; value: string }[]
}) => {
  const isPaymentsForm =
    form?.responseMode === FormResponseMode.Encrypt
      ? form.payments_field.enabled
      : false
  const isMultiRespondentForm =
    form?.responseMode === FormResponseMode.Multirespondent

  const { currentPage: currentPage1Indexed, onRowClick } =
    useUnlockedResponses()

  const navigate = useNavigate()

  const currentPage = useMemo(
    () => (currentPage1Indexed ?? 1) - 1,
    [currentPage1Indexed],
  )

  const columns = useMemo(() => {
    const baseColumns = isMultiRespondentForm
      ? MRF_RESPONSE_TABLE_COLUMNS
      : isPaymentsForm
        ? PAYMENT_RESPONSE_TABLE_COLUMNS
        : BASE_RESPONSE_TABLE_COLUMNS

    const filteredBaseColumns = baseColumns.filter((column) => {
      return (
        selectedSubmissionMetaFields.some(
          (field) => field._id === column.Header,
        ) || column.Header === '#'
      )
    })

    const selectFieldColumns =
      selectedFields.map((field) => ({
        Header: field.title,
        id: field._id, // Store the field ID for filtering
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        accessor: (row: any) => {
          const response = row.decryptedResponses.find(
            (response: FormField) => response._id === field._id,
          )
          return response?.answer ?? ''
        },
      })) ?? []
    const columnsWithFields = filteredBaseColumns.concat(selectFieldColumns)
    return columnsWithFields
  }, [
    isMultiRespondentForm,
    isPaymentsForm,
    selectedSubmissionMetaFields,
    selectedFields,
  ])

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
      data: decryptedResponses,
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

  if (decryptedResponses.length === 0 || isResponseLimitExceeded) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        py="4rem"
        color="secondary.400"
      >
        <Text textStyle="subhead-1">
          {isResponseLimitExceeded
            ? 'Response limit exceeded. Please filter to a smaller date range.'
            : 'No responses match your current filters.'}
        </Text>
      </Box>
    )
  }

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
            {headerGroup.headers.map((column) => {
              // Use column.id if available (for form fields), otherwise use Header (for meta fields)
              const columnId = column.id || String(column.Header)
              const columnTitle = String(column.Header)
              const isNumberColumn = column.Header === '#'
              const canShowMenu = onHideColumn && onAddFilter && !isNumberColumn
              // Find the current filter value for this column
              const currentFilter = filters.find((f) => f.fieldId === columnId)

              return (
                <Th
                  as="div"
                  pos="relative"
                  {...column.getHeaderProps()}
                  key={column.getHeaderProps().key}
                >
                  {canShowMenu ? (
                    <ColumnHeaderMenu
                      columnId={columnId}
                      columnTitle={columnTitle}
                      currentFilterValue={currentFilter?.value}
                      onHideColumn={onHideColumn}
                      onAddFilter={onAddFilter}
                      onRemoveFilter={onRemoveFilter}
                    />
                  ) : (
                    <Flex align="center">{column.render('Header')}</Flex>
                  )}

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
              )
            })}
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
                    overflow="clip"
                    textOverflow="ellipsis"
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
