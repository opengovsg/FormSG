import { BiChevronLeft, BiChevronRight } from 'react-icons/bi'
import {
  Button,
  ButtonProps,
  Flex,
  Icon,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { PAGINATION_THEME_KEY } from '~theme/components/Pagination'
import { usePaginationRange } from '~hooks/usePaginationRange'

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
  selectedPage: PaginationProps['currentPage']
  page: number | typeof SEPARATOR
  onClick: PaginationProps['onPageChange']
}

const PageButton = ({ selectedPage, page, onClick }: PageButtonProps) => {
  const isSelected = page === selectedPage

  const styles = useMultiStyleConfig(PAGINATION_THEME_KEY, { isSelected })

  if (page === SEPARATOR) {
    return <Text sx={styles.separator}>{page}</Text>
  }

  return (
    <Button sx={styles.button} onClick={() => onClick(page)}>
      {page}
    </Button>
  )
}

interface StepButtonProps extends ButtonProps {
  onClick: () => void
  children: React.ReactNode
}

const StepButton = ({ onClick, children, ...props }: StepButtonProps) => {
  return (
    <Button onClick={onClick} {...props}>
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

  const styles = useMultiStyleConfig(PAGINATION_THEME_KEY, {})

  return (
    <Flex __css={styles.container}>
      <StepButton
        sx={styles.stepperback}
        isDisabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <Icon fontSize="1.5rem" as={BiChevronLeft} />
        Back
      </StepButton>
      {paginationRange.map((p, i) => (
        <PageButton
          key={i}
          page={p}
          selectedPage={currentPage}
          onClick={onPageChange}
        />
      ))}
      <StepButton
        sx={styles.steppernext}
        isDisabled={currentPage === totalPageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
        <Icon fontSize="1.5rem" as={BiChevronRight} />
      </StepButton>
    </Flex>
  )
}
