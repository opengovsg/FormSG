import { useBreakpointValue } from '@chakra-ui/react'

import { PaginationDesktop } from './PaginationDesktop'
import { PaginationMobile } from './PaginationMobile'

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

  /**
   * Whether pagination buttons are disabled.
   */
  isDisabled?: boolean
}

export const Pagination = (props: PaginationProps): JSX.Element => {
  const isShowMobileVariant = useBreakpointValue({
    base: true,
    xs: true,
    sm: true,
    md: false,
    lg: false,
    xl: false,
  })

  return isShowMobileVariant ? (
    <Pagination.Mobile {...props} />
  ) : (
    <Pagination.Desktop {...props} />
  )
}

Pagination.Desktop = PaginationDesktop
Pagination.Mobile = PaginationMobile
