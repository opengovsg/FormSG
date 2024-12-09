import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Column,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useTable,
} from 'react-table'
import { Flex, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

import { FormResponseMode, SubmissionMetadata } from '~shared/types'
import { centsToDollars } from '~shared/utils/payments'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useUnlockedResponses } from '../UnlockedResponsesProvider'

import { getNetAmount } from './utils'

type ResponseColumnData = SubmissionMetadata

const NON_MRF_RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
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
    minWidth: 250,
    width: 250,
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
    width: 300,
    minWidth: 300,
    maxWidth: 300,
  },
  {
    Header: 'Status',
    accessor: 'workflowStatus',
    width: 176,
    minWidth: 176,
    maxWidth: 176,
  },
  {
    Header: 'Current Step',
    accessor: 'workflowStep',
    width: 176,
    minWidth: 176,
    maxWidth: 176,
  },
  {
    Header: 'Timestamp of first response',
    accessor: 'submissionTime',
    width: 320,
    minWidth: 320,
    maxWidth: 320,
  },
]

const PAYMENT_RESPONSE_TABLE_COLUMNS =
  NON_MRF_RESPONSE_TABLE_COLUMNS.concat(PAYMENT_COLUMNS)

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
    return NON_MRF_RESPONSE_TABLE_COLUMNS
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
    >
      <Thead as="div" pos="sticky" top={0}>
        {headerGroups.map((headerGroup) => (
          <Tr
            as="div"
            {...headerGroup.getHeaderGroupProps()}
            // To toggle _groupHover styles to show divider when header is hovered.
            data-group
          >
            {headerGroup.headers.map((column) => (
              <Th as="div" pos="relative" {...column.getHeaderProps()}>
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
                  <Td as="div" {...cell.getCellProps()}>
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
