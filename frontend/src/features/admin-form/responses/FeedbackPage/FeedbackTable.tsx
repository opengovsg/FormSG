import { useEffect } from 'react'
import {
  Column,
  useFlexLayout,
  usePagination,
  useResizeColumns,
  useSortBy,
  useTable,
} from 'react-table'
import { Flex, Icon, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

import { ProcessedFeedbackMeta, ProcessedIssueMeta } from '~shared/types/form'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

export const FeedbackTable = ({
  feedbackData,
  feedbackColumns,
  currentPage,
}: {
  feedbackData: ProcessedFeedbackMeta[] | ProcessedIssueMeta[] | undefined
  feedbackColumns: Column[]
  currentPage: number
}) => {
  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
  } = useTable(
    {
      columns: feedbackColumns,
      data: feedbackData ?? [],
      initialState: {
        pageIndex: currentPage,
        pageSize: 10,
        sortBy: [
          {
            id: 'timestamp',
            desc: true,
          },
        ],
      },
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
    <Table as="div" variant="solid" colorScheme="sub" {...getTableProps()}>
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
                    borderColor="brand.secondary.500"
                    _hover={{
                      bg: column.isResizing ? 'white' : 'brand.secondary.200',
                    }}
                    _groupHover={{
                      bg: column.isResizing ? 'white' : 'brand.secondary.300',
                      _hover: {
                        bg: column.isResizing ? 'white' : 'brand.secondary.200',
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
