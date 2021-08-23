/**
 * Custom hook to generate page ranges for any pagination component.
 * Referenced from
 * https://www.freecodecamp.org/news/build-a-custom-pagination-component-in-react/
 */

import { useMemo } from 'react'
import range from 'lodash/range'

interface UsePaginationRangeProps<T extends unknown = string> {
  /**
   * Number of pages to display to left and right of current page.
   */
  siblingCount: number

  /**
   * Total number of elements to paginate.
   */
  totalCount: number

  /**
   * Size of each page. Determines the number of rendered page counts.
   */
  pageSize: number

  /**
   * Represents the current active page. Note that a `1-based index` is used.
   */
  currentPage: number

  /**
   * A constant to denote a separator in the pagination component.
   */
  separator: T
}

export const usePaginationRange = <T extends unknown = string>({
  totalCount,
  pageSize,
  siblingCount,
  currentPage,
  separator,
}: UsePaginationRangeProps<T>): (T | number)[] => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize)

    // Only show separators if the currently shown numbers have at least a gap
    // of 2 numbers to the first or last page numbers.
    const minGapSize = 2
    // The maximum number of pages to display is determined as
    // firstPage + (2 * siblingCount) + currentPage + (2 * separator) + lastPage.
    // E.g. [1, ..., 5, 6, 7, ..., 15] for siblingCount of 1, and
    // [1, ..., 5, 6, 7, 8, 9, ..., 15] for siblingCount of 2.
    const numPageDisplaySlots = 2 * siblingCount + 5

    /**
     * Case 1:
     * If the number of pages is less than the page numbers we want to show in
     * the component, we return the range [1..totalPageCount]
     */
    if (numPageDisplaySlots >= totalPageCount) {
      return range(1, totalPageCount + 1)
    }

    // Calculate left and right sibling index and make sure they are within
    // range [1..totalPageCount]
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount,
    )

    // Do not show separator just when there is just one page number to be
    // inserted between the extremes of sibling and the page limits
    // i.e 1 and totalPageCount.
    const shouldShowLeftSeparator = leftSiblingIndex - 1 > minGapSize
    const shouldShowRightSeparator =
      totalPageCount - rightSiblingIndex > minGapSize

    /**
     * Case 2: No left separator to show, but right separator to be shown.
     */
    if (!shouldShowLeftSeparator && shouldShowRightSeparator) {
      // 2 indicates separator and final page number.
      const leftItemCount = numPageDisplaySlots - 2
      const leftRange = range(1, leftItemCount + 1)

      return [...leftRange, separator, totalPageCount]
    }

    /**
     * Case 3: No right separator to show, but left separator to be shown.
     */
    if (shouldShowLeftSeparator && !shouldShowRightSeparator) {
      // 2 indicates first page number and the separator.
      const rightItemCount = numPageDisplaySlots - 2
      const rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount + 1,
      )
      return [1, separator, ...rightRange]
    }

    /**
     * Case 4: Both left and right separator to be shown
     */
    if (shouldShowLeftSeparator && shouldShowRightSeparator) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex + 1)
      return [1, separator, ...middleRange, separator, totalPageCount]
    }

    // This should never be reached, but in case it is, return the range
    // [1..totalPageCount]
    return range(1, totalPageCount + 1)
  }, [totalCount, pageSize, siblingCount, currentPage, separator])

  return paginationRange
}
