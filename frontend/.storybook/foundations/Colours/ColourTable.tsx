import { useTheme } from '@chakra-ui/react'
import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/table'

interface ColourTableProps {
  label: string
  colours: {
    palette: string
    shade: string
  }[]
}

export const ColourTable = ({
  label,
  colours,
}: ColourTableProps): JSX.Element => {
  const theme = useTheme()

  return (
    <Table variant="simple">
      <TableCaption>{label}</TableCaption>
      <Thead>
        <Tr>
          <Th w="15rem">Variable</Th>
          <Th w="5rem">Hex</Th>
          <Th>Colour</Th>
        </Tr>
      </Thead>
      <Tbody>
        {colours.map((d) => {
          const hexCode = theme.colors[d.palette][d.shade]
          return (
            <Tr key={d.shade}>
              <Td>
                {d.palette}.{d.shade}
              </Td>
              <Td>{hexCode}</Td>
              <Td bg={hexCode}></Td>
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}
