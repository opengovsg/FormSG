import { useEffect } from 'react'
import {
  Column,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useTable,
} from 'react-table'
import { Flex, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

import { StorageModeSubmissionMetadata } from '~shared/types'

type ResponseColumnData = StorageModeSubmissionMetadata

const RESPONSE_TABLE_COLUMNS: Column<ResponseColumnData>[] = [
  {
    Header: '#',
    accessor: (_row, i) => i + 1,
    minWidth: 80, // minWidth is only used as a limit for resizing
    width: 80, // width is used for both the flex-basis and flex-grow
    maxWidth: 100, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Reference',
    accessor: 'refNo',
    minWidth: 120, // minWidth is only used as a limit for resizing
    width: 120, // width is used for both the flex-basis and flex-grow
    maxWidth: 240, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Submission time',
    accessor: 'submissionTime',
    minWidth: 200,
    width: 300,
    disableResizing: true,
  },
]

interface ResponsesTableProps {
  metadata: StorageModeSubmissionMetadata[]
  currentPage: number
}

export const ResponsesTable = ({
  metadata,
  currentPage,
}: ResponsesTableProps) => {
  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
  } = useTable<ResponseColumnData>(
    {
      columns: RESPONSE_TABLE_COLUMNS,
      data: metadata,
      initialState: {
        pageIndex: currentPage,
        pageSize: 10,
      },
    },
    usePagination,
    useResizeColumns,
    useFlexLayout,
  )

  console.log('metadata', metadata)
  console.log('page', page)

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
            <Tr as="div" {...row.getRowProps()} px={0}>
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
