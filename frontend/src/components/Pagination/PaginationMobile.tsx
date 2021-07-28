/**
 * Mobile variant for the Pagination component.
 */

import { useCallback } from 'react'
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import { Box, IconButton, Text, useMultiStyleConfig } from '@chakra-ui/react'

import { PAGINATION_THEME_KEY } from '~theme/components/Pagination'

import { PaginationProps } from './Pagination'

type PaginationMobileProps = Omit<PaginationProps, 'siblingCount'>

export const PaginationMobile = ({
  pageSize,
  onPageChange,
  totalCount,
  currentPage,
}: PaginationMobileProps): JSX.Element => {
  const styles = useMultiStyleConfig(PAGINATION_THEME_KEY, {})

  const totalPageCount = Math.ceil(totalCount / pageSize)
  const isDisableNextPage = currentPage >= totalPageCount
  const isDisablePrevPage = currentPage <= 1

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
      <Text sx={styles.text}>
        Page {currentPage} of {totalPageCount}
      </Text>
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
