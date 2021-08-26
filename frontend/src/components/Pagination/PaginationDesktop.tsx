/**
 * Desktop variant for the Pagination component.
 */

import { useCallback } from 'react'
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { PAGINATION_THEME_KEY } from '~theme/components/Pagination'
import { usePaginationRange } from '~hooks/usePaginationRange'

import { PaginationProps } from './Pagination'

// Separate constant to denote a separator in the pagination component.
const SEPARATOR = '\u2026'

interface DesktopPageButtonProps {
  selectedPage: PaginationProps['currentPage']
  page: number | typeof SEPARATOR
  onClick: PaginationProps['onPageChange']
  isDisabled: PaginationProps['isDisabled']
}

const DesktopPageButton = ({
  selectedPage,
  page,
  onClick,
  isDisabled,
}: DesktopPageButtonProps) => {
  const isSelected = page === selectedPage

  const styles = useMultiStyleConfig(PAGINATION_THEME_KEY, { isSelected })

  const handleClick = useCallback(() => {
    if (page === SEPARATOR) return
    onClick(page)
  }, [onClick, page])

  if (page === SEPARATOR) {
    return <Text sx={styles.separator}>{page}</Text>
  }

  return (
    <Button sx={styles.button} onClick={handleClick} isDisabled={isDisabled}>
      {page}
    </Button>
  )
}

export const PaginationDesktop = ({
  siblingCount = 1,
  pageSize,
  onPageChange,
  totalCount,
  currentPage,
  isDisabled,
}: PaginationProps): JSX.Element => {
  const paginationRange = usePaginationRange<typeof SEPARATOR>({
    totalCount,
    pageSize,
    currentPage,
    siblingCount,
    separator: SEPARATOR,
  })

  const styles = useMultiStyleConfig(PAGINATION_THEME_KEY, {})

  const totalPageCount = Math.ceil(totalCount / pageSize)
  const isDisableNextPage = isDisabled || currentPage >= totalPageCount
  const isDisablePrevPage = isDisabled || currentPage <= 1

  const handlePageBack = useCallback(() => {
    if (isDisablePrevPage) return
    onPageChange(currentPage - 1)
  }, [currentPage, isDisablePrevPage, onPageChange])

  const handlePageNext = useCallback(() => {
    if (isDisableNextPage) return
    onPageChange(currentPage + 1)
  }, [currentPage, isDisableNextPage, onPageChange])

  return (
    <Box __css={styles.container}>
      <IconButton
        sx={styles.stepper}
        aria-label="Previous page"
        isDisabled={isDisablePrevPage}
        onClick={handlePageBack}
        icon={<BiChevronLeft />}
      />
      <HStack spacing="0.125rem">
        {paginationRange.map((p, i) => (
          <DesktopPageButton
            key={i}
            page={p}
            isDisabled={isDisabled}
            selectedPage={currentPage}
            onClick={onPageChange}
          />
        ))}
      </HStack>
      <IconButton
        sx={styles.stepper}
        aria-label="Next page"
        isDisabled={isDisableNextPage}
        onClick={handlePageNext}
        icon={<BiChevronRight />}
      />
    </Box>
  )
}
