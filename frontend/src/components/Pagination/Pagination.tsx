/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from 'react'
import { Box, Button, ButtonProps, Flex, HStack, Text } from '@chakra-ui/react'
import range from 'lodash/range'

import { usePaginationRange } from '~/hooks/usePaginationRange'

// Separate constant to denote a separator in the pagination component.
const SEPARATOR = '\u2026'

export interface PaginationProps {
  /**
   * Number of pages to display to left and right of current page.
   * Defaults to `1`.
   */
  siblingCount?: number

  /**
   * Total number of elements to paginate.
   */
  totalCount: number

  /**
   * Size of each page. Determines the number of rendered page counts.
   */
  pageSize: number

  /**
   * Callback function invoked with the updated page when the page is changed.
   */
  onPageChange: (page: number) => void

  /**
   * Represents the current active page. Note that a `1-based index` is used.
   */
  currentPage: number
}

interface PageButtonProps {
  activePage: PaginationProps['currentPage']
  page: number
  onClick: PaginationProps['onPageChange']
}

const PageButton = ({ activePage, page, onClick }: PageButtonProps) => {
  const isActive = page === activePage
  return (
    <Button
      p="0.25rem"
      minH="2rem"
      minW="2rem"
      border="none"
      textStyle="body-2"
      bg={isActive ? 'secondary.500' : 'transparent'}
      _active={{
        bg: isActive ? 'secondary.700' : 'secondary.200',
      }}
      _hover={{
        bg: isActive ? 'secondary.600' : 'secondary.100',
      }}
      color={isActive ? 'white' : 'secondary.500'}
      onClick={() => onClick(page)}
    >
      {page}
    </Button>
  )
}

interface StepButtonProps extends ButtonProps {
  onClick: () => void
  isDisabled?: boolean
  children: React.ReactNode
}

const StepButton = ({
  onClick,
  isDisabled,
  children,
  ...props
}: StepButtonProps) => {
  return (
    <Button
      bg="transparent"
      _hover={{
        bg: 'secondary.100',
        color: 'secondary.600',
      }}
      _active={{
        bg: 'secondary.200',
      }}
      _disabled={{
        bg: 'transparent',
        cursor: 'not-allowed',
        color: 'secondary.300',
        _hover: {
          bg: 'transparent',
          color: 'secondary.300',
        },
      }}
      isDisabled={isDisabled}
      p="0.25rem"
      minH="2rem"
      minW="2rem"
      border="none"
      textStyle="body-2"
      color="secondary.500"
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export const Pagination = ({
  siblingCount = 1,
  pageSize,
  onPageChange,
  totalCount,
  currentPage,
}: PaginationProps): JSX.Element => {
  const paginationRange = usePaginationRange<typeof SEPARATOR>({
    totalCount,
    pageSize,
    currentPage,
    siblingCount,
    separator: SEPARATOR,
  })

  const totalPageCount = Math.ceil(totalCount / pageSize)

  return (
    <Flex>
      <StepButton
        mr="1rem"
        isDisabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Back
      </StepButton>
      {paginationRange.map((p, i) => {
        if (p === SEPARATOR) return <Text key={i}>{p}</Text>
        return (
          <PageButton
            key={i}
            page={p}
            activePage={currentPage}
            onClick={onPageChange}
          />
        )
      })}
      <StepButton
        ml="1rem"
        isDisabled={currentPage === totalPageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </StepButton>
    </Flex>
  )
}
