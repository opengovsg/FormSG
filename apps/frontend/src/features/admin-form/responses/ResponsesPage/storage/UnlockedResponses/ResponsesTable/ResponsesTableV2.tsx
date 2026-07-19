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
  Box,
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { FormField } from '@opengovsg/formsg-sdk/dist/types'

import {
  MRF_RESPONSE_TIMESTAMP_LABEL,
  RESPONSE_ID_LABEL,
} from '~features/admin-form/responses/constants'

import { DecryptedResponse } from '../../useDecryptedResponsesQuery'
import { getDecryptedResponseInstance } from '../../utils/getDecryptedResponseInstance'
import { useUnlockedResponses } from '../UnlockedResponsesProvider'

// Base storage-mode columns, rendered alongside the selected field columns.
const BASE_RESPONSE_TABLE_COLUMNS: Column<DecryptedResponse>[] = [
  {
    Header: '#',
    accessor: 'number',
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    // Fixed-width index column; no resize handle.
    disableResizing: true,
  },
  {
    Header: RESPONSE_ID_LABEL,
    id: RESPONSE_ID_LABEL,
    accessor: 'refNo',
    // Fits a full 24-char ObjectId; resizable down to minWidth.
    width: 250,
    minWidth: 100,
  },
  {
    Header: MRF_RESPONSE_TIMESTAMP_LABEL,
    id: MRF_RESPONSE_TIMESTAMP_LABEL,
    accessor: 'submissionTime',
    width: 250,
    minWidth: 100,
  },
]

/**
 * Rows per page. The whole working set is decrypted client-side, but the table
 * is not virtualised, so keep the mounted DOM small by paginating it locally.
 */
export const RESPONSES_TABLE_V2_PAGE_SIZE = 50

export const ResponsesTableV2 = ({
  selectedFields,
  selectedSubmissionMetaFields,
  decryptedResponses,
}: {
  selectedFields: {
    _id: string
    title: string
  }[]
  selectedSubmissionMetaFields: {
    _id: string
    title: string
  }[]
  decryptedResponses: DecryptedResponse[]
}) => {
  const { t } = useTranslation()
  const { currentPage: currentPage1Indexed, onRowClick } =
    useUnlockedResponses()

  const navigate = useNavigate()

  const currentPage = useMemo(
    () => (currentPage1Indexed ?? 1) - 1,
    [currentPage1Indexed],
  )

  const columns = useMemo(() => {
    const filteredBaseColumns = BASE_RESPONSE_TABLE_COLUMNS.filter((column) => {
      return (
        selectedSubmissionMetaFields.some(
          (field) => field._id === column.Header,
        ) || column.Header === '#'
      )
    })

    const selectFieldColumns = selectedFields.map((field) => ({
      Header: field.title,
      id: field._id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessor: (row: any) => {
        const response = row.decryptedResponses.find(
          (response: FormField) => response._id === field._id,
        )
        if (!response) return ''
        try {
          // Serialize the same way as the CSV export so answerArray-based
          // fields (Checkbox, Table) render instead of showing up blank.
          const instance = getDecryptedResponseInstance(response)
          return Array.from({ length: instance.numCols }, (_, colIndex) =>
            instance.getAnswer(colIndex),
          ).join(';')
        } catch {
          return response.answer ?? ''
        }
      },
    }))

    return [...filteredBaseColumns, ...selectFieldColumns]
  }, [selectedSubmissionMetaFields, selectedFields])

  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
  } = useTable<DecryptedResponse>(
    {
      columns,
      data: decryptedResponses,
      initialState: {
        pageIndex: currentPage,
        pageSize: RESPONSES_TABLE_V2_PAGE_SIZE,
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

  if (decryptedResponses.length === 0) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        py="4rem"
        color="secondary.400"
      >
        <Text textStyle="subhead-1">
          {t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.unlockedResponses.noResponsesToDisplay',
          )}
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
          const rowProps = row.getRowProps()
          return (
            <Tr
              as="div"
              {...rowProps}
              key={rowProps.key}
              // useFlexLayout sizes the row to the columns' combined min-widths,
              // so cells overflow and the hover background stops short of the
              // scrolled-in columns. Grow to content (max-content), but keep it
              // at least viewport width (100%).
              style={{
                ...rowProps.style,
                minWidth: '100%',
                width: 'max-content',
              }}
              px={0}
              // Read from row.original, not row.values: the Response ID column
              // sets an explicit id, so row.values.refNo is undefined.
              onClick={() =>
                handleRowClick(row.original.refNo, row.original.number)
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
                    overflow="hidden"
                  >
                    {/* Truncate long values instead of wrapping; widen the
                        column to reveal more. */}
                    <Text isTruncated minW={0}>
                      {cell.render('Cell')}
                    </Text>
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
