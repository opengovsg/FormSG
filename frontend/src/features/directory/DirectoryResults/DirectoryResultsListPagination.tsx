import { useState } from 'react'
import {
  BiChevronLeft,
  BiChevronRight,
  BiDotsHorizontalRounded,
} from 'react-icons/bi'
import { Box, Flex } from '@chakra-ui/react'

import Button, { ButtonProps } from '~components/Button'

const NUM_RESULTS_PER_PAGE = 25

export type UseDirectoryResultsListPaginationReturn<T> = {
  data: T[]
  paginatedData: T[]
  maxNumOfPages: number
  page: number
  isFirstPageSelected: boolean
  isLastPageSelected: boolean
  onPageSelect: (page: number) => void
  onNextPageSelect: () => void
  onPreviousPageSelect: () => void
  onFirstPageSelect: () => void
  onLastPageSelect: () => void
}

export const useDirectoryResultsListPagination = <T,>(
  data: T[],
): UseDirectoryResultsListPaginationReturn<T> => {
  const [page, setPage] = useState(0)

  const maxNumOfPages = Math.ceil(data.length / NUM_RESULTS_PER_PAGE)

  const paginatedData = data.slice(
    NUM_RESULTS_PER_PAGE * page,
    NUM_RESULTS_PER_PAGE * (page + 1),
  )

  const onPageSelect = (page: number) => {
    if (page < 0 || page >= maxNumOfPages) return
    setPage(page)
  }

  const onNextPageSelect = () => {
    if (page + 1 >= maxNumOfPages) return
    setPage(page + 1)
  }

  const onPreviousPageSelect = () => {
    if (page <= 0) return
    setPage(page - 1)
  }

  const onFirstPageSelect = () => setPage(0)

  const onLastPageSelect = () => setPage(maxNumOfPages - 1)

  return {
    data,
    paginatedData,
    maxNumOfPages,
    page,
    isFirstPageSelected: page <= 0,
    isLastPageSelected: page >= maxNumOfPages - 1,
    onPageSelect,
    onNextPageSelect,
    onPreviousPageSelect,
    onFirstPageSelect,
    onLastPageSelect,
  }
}

export type DirectoryResultsListPaginationProps<T> =
  UseDirectoryResultsListPaginationReturn<T>

export const DirectoryResultsListPagination = <T,>({
  maxNumOfPages,
  page,
  isFirstPageSelected,
  isLastPageSelected,
  onPageSelect,
  onNextPageSelect,
  onPreviousPageSelect,
  onFirstPageSelect,
  onLastPageSelect,
}: DirectoryResultsListPaginationProps<T>) => {
  return (
    <Flex gap="0.5rem" alignItems="center">
      <PaginationButton
        onClick={onPreviousPageSelect}
        isDisabled={isFirstPageSelected}
      >
        <BiChevronLeft />
      </PaginationButton>
      <PaginationButton
        isActive={isFirstPageSelected}
        onClick={onFirstPageSelect}
      >
        1
      </PaginationButton>
      {page > 3 && (
        <Box textColor="primary.500">
          <BiDotsHorizontalRounded />
        </Box>
      )}
      {page > 2 && (
        <PaginationButton onClick={() => onPageSelect(page - 2)}>
          {page - 1}
        </PaginationButton>
      )}
      {page > 1 && (
        <PaginationButton onClick={() => onPageSelect(page - 1)}>
          {page}
        </PaginationButton>
      )}
      {!isFirstPageSelected && !isLastPageSelected && (
        <PaginationButton isActive={true}>{page + 1}</PaginationButton>
      )}
      {page < maxNumOfPages - 2 && (
        <PaginationButton onClick={() => onPageSelect(page + 1)}>
          {page + 2}
        </PaginationButton>
      )}
      {page < maxNumOfPages - 3 && (
        <PaginationButton onClick={() => onPageSelect(page + 2)}>
          {page + 3}
        </PaginationButton>
      )}
      {page < maxNumOfPages - 4 && (
        <Box textColor="primary.500">
          <BiDotsHorizontalRounded />
        </Box>
      )}
      {maxNumOfPages > 1 && (
        <PaginationButton
          isActive={isLastPageSelected}
          onClick={onLastPageSelect}
        >
          {maxNumOfPages}
        </PaginationButton>
      )}
      <PaginationButton
        onClick={onNextPageSelect}
        isDisabled={isLastPageSelected}
      >
        <BiChevronRight />
      </PaginationButton>
    </Flex>
  )
}

const PaginationButton = ({ children, ...props }: ButtonProps) => {
  return (
    <Button size="sm" px="0.5rem" variant="clear" {...props}>
      {children}
    </Button>
  )
}
