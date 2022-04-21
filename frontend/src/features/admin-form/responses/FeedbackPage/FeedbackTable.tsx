import { useEffect, useMemo } from 'react'
import {
  Column,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useSortBy,
  useTable,
} from 'react-table'
import {
  Box,
  Flex,
  Icon,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

import { ProcessedFeedbackMeta } from '~shared/types/form'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

type FeedbackColumnData = {
  index: number
  date: string
  feedback: string
  rating: number
}

const FEEDBACK_TABLE_COLUMNS: Column<FeedbackColumnData>[] = [
  {
    Header: '#',
    accessor: 'index',
    sortType: 'basic',
    minWidth: 50, // minWidth is only used as a limit for resizing
    width: 50, // width is used for both the flex-basis and flex-grow
    maxWidth: 100, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Date',
    accessor: 'date',
    sortType: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.values[columnId]) //rowA.values[columnId] is a date string
      const dateB = new Date(rowB.values[columnId])
      return dateA > dateB ? 1 : -1
    },
    minWidth: 120, // minWidth is only used as a limit for resizing
    width: 120, // width is used for both the flex-basis and flex-grow
    maxWidth: 240, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Feedback',
    accessor: 'feedback',
    sortType: 'basic',
    minWidth: 200,
    width: 300,
    maxWidth: 600,
  },
  {
    Header: 'Rating',
    accessor: 'rating',
    sortType: 'basic',
    minWidth: 70, // minWidth is only used as a limit for resizing
    width: 70, // width is used for both the flex-basis and flex-grow
    maxWidth: 100, // maxWidth is only used as a limit for resizing
  },
]

export const FeedbackTable = ({
  feedbackData,
  currentPage,
}: {
  feedbackData: ProcessedFeedbackMeta[] | undefined
  currentPage: number
}) => {
  const data = useMemo(() => {
    return (
      feedbackData?.map((feedback) => {
        return {
          index: feedback.index,
          date: feedback.date,
          feedback: feedback.comment,
          rating: feedback.rating,
        }
      }) ?? []
    )
  }, [feedbackData])

  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
  } = useTable<FeedbackColumnData>(
    {
      columns: FEEDBACK_TABLE_COLUMNS,
      data,
      initialState: { pageIndex: currentPage, pageSize: 9 },
    },
    useSortBy,
    usePagination,
    useResizeColumns,
    useFlexLayout,
  )

  useEffect(() => {
    gotoPage(currentPage)
  }, [currentPage, gotoPage])

  return (
    <Table
      as="div"
      variant="solid"
      colorScheme="secondary"
      {...getTableProps()}
    >
      <Thead as="div" pos="sticky" top={0}>
        {headerGroups.map((headerGroup) => (
          <Tr as="div" {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <Th as="div" pos="relative" {...column.getHeaderProps()}>
                <Flex align="center" {...column.getSortByToggleProps()}>
                  {column.render('Header')}
                  {column.isSorted ? (
                    <Icon
                      fontSize="1rem"
                      as={
                        column.isSorted && column.isSortedDesc
                          ? BxsChevronDown
                          : BxsChevronUp
                      }
                    />
                  ) : null}
                </Flex>

                <Box
                  {...column.getResizerProps()}
                  sx={{
                    right: 0,
                    background: column.isResizing ? 'red' : 'blue',
                    width: '10px',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    zIndex: 1,
                    touchAction: 'none',
                  }}
                />
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody as="div" {...getTableBodyProps()}>
        {page.map((row) => {
          prepareRow(row)
          return (
            <Tr as="div" {...row.getRowProps()} px={0}>
              {row.cells.map((cell) => {
                return (
                  <Td
                    {...(cell.column.id === 'feedback' ? { px: 0, pl: 0 } : {})}
                    as="div"
                    {...cell.getCellProps()}
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
