import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'

export const TableChart = ({ data }: { data: [string, number | string][] }) => {
  return (
    <TableContainer>
      <Table variant="simple" my="1rem">
        <Thead>
          <Tr>
            <Th>Answer</Th>
            <Th isNumeric>Count</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map(([answer, count], idx) => {
            if (typeof count === 'number')
              return (
                <TableChartRows
                  answer={answer}
                  value={count}
                  key={`${answer}-${idx}`} // A more stable key
                />
              )
            return null
          })}
        </Tbody>
      </Table>
    </TableContainer>
  )
}

const TableChartRows = ({
  answer,
  value,
}: {
  answer: string
  value: number
}) => {
  return (
    <Tr>
      <Td>{answer}</Td>
      <Td>{value}</Td>
    </Tr>
  )
}
