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
  const [header, ...rows] = data
  return (
    <TableContainer>
      <Table variant="solid" colorScheme="secondary" my="1rem">
        <Thead>
          <Tr>
            <Th borderX="1px solid" borderColor="secondary.500">
              {header[0]}
            </Th>
            <Th borderX="1px solid" borderColor="secondary.500" isNumeric>
              {header[1]}
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map(([answer, count], idx) => {
            if (typeof count === 'number')
              return (
                <TableChartRows
                  answer={answer}
                  value={count}
                  key={`${answer}-${idx}`}
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
      <Td
        borderX="1px solid"
        borderLeftColor="neutral.300"
        borderRightColor="neutral.300"
      >
        {answer}
      </Td>
      <Td
        borderColor="neutral.300"
        borderRight="1px solid"
        borderRightColor="neutral.300"
      >
        {value}
      </Td>
    </Tr>
  )
}
