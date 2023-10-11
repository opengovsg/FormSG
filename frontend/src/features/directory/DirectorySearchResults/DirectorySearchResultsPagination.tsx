import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from 'react-icons/bi'
import { Flex } from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'

export type DirectorySearchResultsPaginationProps = {
  maxNumberOfPages: number
  currentPage: number
  setCurrentPage: (page: number) => void
}

export const DirectorySearchResultsPagination = ({
  maxNumberOfPages,
  currentPage,
  setCurrentPage,
}: DirectorySearchResultsPaginationProps) => {
  return (
    <Flex gap="0.5rem" alignSelf="center">
      <IconButton
        icon={<BiChevronsLeft />}
        size="sm"
        variant="clear"
        aria-label={'First page'}
        onClick={() => setCurrentPage(0)}
        isDisabled={currentPage === 0}
      />
      <IconButton
        icon={<BiChevronLeft />}
        size="sm"
        variant="clear"
        aria-label={'Previous page'}
        onClick={() =>
          currentPage > 0 ? setCurrentPage(currentPage - 1) : null
        }
        isDisabled={currentPage === 0}
      />
      {Array.from(Array(maxNumberOfPages)).map((_, i) => (
        <Button
          size="sm"
          variant="clear"
          isActive={currentPage === i}
          onClick={() => setCurrentPage(i)}
          key={i}
        >
          {i + 1}
        </Button>
      ))}
      <IconButton
        icon={<BiChevronRight />}
        size="sm"
        variant="clear"
        aria-label={'Next page'}
        onClick={() =>
          currentPage + 1 < maxNumberOfPages
            ? setCurrentPage(currentPage + 1)
            : null
        }
        isDisabled={currentPage === maxNumberOfPages - 1}
      />
      <IconButton
        icon={<BiChevronsRight />}
        size="sm"
        variant="clear"
        aria-label={'Last page'}
        onClick={() => setCurrentPage(maxNumberOfPages - 1)}
        isDisabled={currentPage === maxNumberOfPages - 1}
      />
    </Flex>
  )
}
