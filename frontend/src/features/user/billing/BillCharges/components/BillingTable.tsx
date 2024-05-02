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

import { FormAuthType, FormBillingStatistic } from '~shared/types'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'

type BillingColumnData = Pick<
  FormBillingStatistic,
  'formName' | 'adminEmail' | 'authType' | 'total'
>

const AUTHTYPE_TO_TEXT: { [K in FormAuthType]?: string } = {
  [FormAuthType.NIL]: '-',
  [FormAuthType.SP]: 'Singpass',
  [FormAuthType.SGID]: 'sgID',
  [FormAuthType.MyInfo]: 'MyInfo',
  [FormAuthType.CP]: 'Corppass',
}

const BILLING_TABLE_COLUMNS: Column<BillingColumnData>[] = [
  {
    Header: 'Form title',
    accessor: 'formName',
    sortType: 'basic',
    minWidth: 300, // minWidth is only used as a limit for resizing
    width: 400, // width is used for both the flex-basis and flex-grow
    maxWidth: 500, // maxWidth is only used as a limit for resizing
  },
  {
    Header: 'Owner',
    accessor: 'adminEmail',
    sortType: 'basic',
    minWidth: 150,
    width: 250,
    maxWidth: 350,
  },
  {
    Header: 'Authentication',
    accessor: (row) => AUTHTYPE_TO_TEXT[row.authType],
    sortType: 'basic',
    minWidth: 150,
    width: 160,
    maxWidth: 170,
  },
  {
    Header: '# of logins',
    accessor: 'total',
    sortType: 'number',
    minWidth: 130,
    width: 140,
    maxWidth: 150,
  },
]

export const BillingTable = ({
  loginStats,
  currentPage,
}: {
  loginStats: FormBillingStatistic[]
  currentPage: number
}) => {
  const {
    prepareRow,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    gotoPage,
  } = useTable<BillingColumnData>(
    {
      columns: BILLING_TABLE_COLUMNS,
      data: loginStats,
      initialState: {
        pageIndex: currentPage,
        pageSize: 10,
        sortBy: [
          {
            id: 'formName',
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
                <Flex align="center" {...column.getSortByToggleProps()}>
                  {column.render('Header')}
                  {column.isSorted ? (
                    <Icon
                      fontSize="1rem"
                      as={column.isSortedDesc ? BxsChevronDown : BxsChevronUp}
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
