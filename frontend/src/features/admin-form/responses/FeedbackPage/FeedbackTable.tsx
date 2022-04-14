import React from 'react'
import { Column, useTable } from 'react-table'
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

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
      },
      {
        Header: 'Date',
        accessor: 'date',
      },
      { Header: 'Feedback', accessor: 'feedback' },
      { Header: 'Rating', accessor: 'rating' },
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

  const { rows, prepareRow } = useTable<Data>({
    columns,
    data,
  })

  return (
    <Table>
      <Thead bgColor="secondary.500">
        <Tr>
          <Th
            color="white"
            pl="1rem"
            textStyle="subhead-2"
            fontWeight="500"
            fontSize="0.875rem"
            textTransform="none"
            width="5rem"
          >
            #
          </Th>
          <Th
            color="white"
            pl="1rem"
            textStyle="subhead-2"
            fontWeight="500"
            fontSize="0.875rem"
            textTransform="none"
            width="10rem"
          >
            Date
          </Th>
          <Th
            color="white"
            pl="1rem"
            textStyle="subhead-2"
            fontWeight="500"
            fontSize="0.875rem"
            textTransform="none"
          >
            Feedback
          </Th>
          <Th
            color="white"
            pl="1rem"
            textStyle="subhead-2"
            fontWeight="500"
            fontSize="0.875rem"
            textTransform="none"
            width="12rem"
          >
            Rating
          </Th>
        </Tr>
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
