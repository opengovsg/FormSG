import React from 'react'
import { Column, useSortBy, useTable } from 'react-table'
import { Box, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

import { ProcessedFeedbackMeta } from '~shared/types/form'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

type Data = {
  index: number
  date: string
  feedback: string
  rating: number
}

export const FeedbackTable = ({
  feedbackData,
}: {
  feedbackData: ProcessedFeedbackMeta[] | undefined
}) => {
  const columns = React.useMemo<Column<Data>[]>(
    () => [
      {
        Header: '#',
        accessor: 'index',
        sortType: 'basic',
        width: '5rem',
      },
      {
        Header: 'Date',
        accessor: 'date',
        sortType: (rowA, rowB) => {
          const dateA = new Date(rowA.values.id)
          const dateB = new Date(rowB.values.id)
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
    ],
    [],
  )

  const data = React.useMemo(() => {
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

  const { rows, prepareRow, headerGroups } = useTable<Data>(
    {
      columns,
      data,
    },
    useSortBy,
  )

  return (
    <Table>
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
                color="white"
                pl="1rem"
                textStyle="subhead-2"
                fontWeight="500"
                fontSize="0.875rem"
                textTransform="none"
              >
                <Box display="flex" flexDir="row">
                  {column.render('Header')}
                  <Icon pb="0.2rem">
                    {column.isSorted ? (
                      column.isSortedDesc ? (
                        <BxsChevronDown fontSize="2rem" />
                      ) : (
                        <BxsChevronUp fontSize="2rem" />
                      )
                    ) : (
                      ''
                    )}
                  </Icon>
                </Box>
              </Th>
            ))}
          </Tr>
        ))}
      </Thead>
      <Tbody>
        {rows.map((row) => {
          prepareRow(row)
          return (
            <Tr>
              {row.cells.map((cell) => {
                return (
                  <Td
                    py="0.625rem"
                    pl="1rem"
                    color="secondary.500"
                    fontWeight="regular"
                    fontSize="0.875rem"
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
