import { useEffect, useMemo } from 'react'
import { Column, usePagination, useSortBy, useTable } from 'react-table'
import { Box, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

import { ProcessedFeedbackMeta } from '~shared/types/form'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useIsMobile } from '~hooks/useIsMobile'

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
    width: '5rem',
  },
  {
    Header: 'Date',
    accessor: 'date',
    sortType: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.values[columnId]) //rowA.values[columnId] is a date string
      const dateB = new Date(rowB.values[columnId])
      return dateA > dateB ? 1 : -1
    },
    width: '10rem',
  },
  {
    Header: 'Feedback',
    accessor: 'feedback',
    sortType: 'basic',
    width: undefined,
  },
  {
    Header: 'Rating',
    accessor: 'rating',
    sortType: 'basic',
    width: '12rem',
  },
]

export const FeedbackTable = ({
  feedbackData,
  currentPage,
}: {
  feedbackData: ProcessedFeedbackMeta[] | undefined
  currentPage: number
}) => {
  const isMobile = useIsMobile()

  const data = useMemo(() => {
    return feedbackData
      ? feedbackData.map((feedback) => {
          return {
            index: feedback.index,
            date: feedback.date,
            feedback: feedback.comment,
            rating: feedback.rating,
          }
        })
      : []
  }, [feedbackData])

  const { prepareRow, headerGroups, page, gotoPage } =
    useTable<FeedbackColumnData>(
      {
        columns: FEEDBACK_TABLE_COLUMNS,
        data,
        initialState: { pageIndex: currentPage, pageSize: 9 },
      },
      useSortBy,
      usePagination,
    )

  useEffect(() => {
    gotoPage(currentPage)
  }, [currentPage, gotoPage])

  return (
    <Table variant="solid" colorScheme="secondary">
      <Thead bgColor="secondary.500">
        {headerGroups.map((headerGroup) => (
          <Tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <Th
                {...column.getHeaderProps(
                  column.getSortByToggleProps({
                    style: {
                      width: column.width,
                    },
                  }),
                )}
              >
                <Box display="flex" flexDir="row">
                  {column.render('Header')}

                  {column.isSorted ? (
                    <Icon
                      as={
                        column.isSorted && column.isSortedDesc
                          ? BxsChevronDown
                          : BxsChevronUp
                      }
                      mt={isMobile ? '0.175rem' : ''}
                    />
                  ) : undefined}
                </Box>
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {page.map((row) => {
          prepareRow(row)
          return (
            <Tr>
              {row.cells.map((cell) => {
                return (
                  <Td
                    {...(cell.column.id === 'feedback' ? { px: 0, pl: 0 } : {})}
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
