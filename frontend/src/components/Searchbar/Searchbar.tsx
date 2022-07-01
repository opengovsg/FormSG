import { KeyboardEvent, useCallback, useRef, useState } from 'react'
import { BiSearch, BiX } from 'react-icons/bi'
import {
  Box,
  Flex,
  forwardRef,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { SEARCHBAR_THEME_KEY } from '~/theme/components/Searchbar'

import IconButton from '../IconButton'

export interface SearchbarProps extends InputProps {
  /**
   * Function to be invoked when user presses enter (to search).
   * @param searchValue value of the search input
   */
  onSearch: (searchValue: string) => void

  /**
   * Whether the searchbar is expandable/collapsable or not. Defaults to `true`.
   */
  isExpandable?: boolean

  /**
   * Whether the searchbar is initially expanded or not. Defaults to `false`.
   * @note Set this to `true` if `isExpandable` is set to `false`, else the
   * searchbar will not be usable.
   */
  isInitiallyExpanded?: boolean

  /**
   * Called when the search icon is clicked and the search bar is expanded.
   */
  onExpand?: () => void

  /**
   * Called when the X icon is clicked and the search bar is collapsed.
   */
  onCollapse?: () => void
}

export const Searchbar = forwardRef<SearchbarProps, 'input'>(
  (
    {
      onSearch,
      isExpandable = true,
      isInitiallyExpanded = false,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onExpand,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onCollapse,
      ...props
    },
    ref,
  ) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(isInitiallyExpanded)

    const innerRef = useRef<HTMLInputElement>(null)
    const styles = useMultiStyleConfig(SEARCHBAR_THEME_KEY, {
      isExpanded,
      ...props,
    })

    const inputRef = useMergeRefs(innerRef, ref)

    const handleSearch = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && innerRef.current) {
          onSearch(innerRef.current.value)
        }
      },
      [onSearch],
    )

    return (
      <Flex>
        <InputGroup flex={isExpanded ? 1 : 0}>
          {isExpanded ? (
            <InputLeftElement pointerEvents="none">
              <Box __css={styles.icon}>
                <Icon as={BiSearch} />
              </Box>
            </InputLeftElement>
          ) : (
            <IconButton
              aria-label="Expand search"
              icon={<BiSearch />}
              variant="clear"
              colorScheme="secondary"
              onClick={() => {
                setIsExpanded(true)
                if (onExpand) onExpand()
              }}
              sx={styles.icon}
            />
          )}
          <Input
            aria-label="Press enter to search"
            ref={inputRef}
            sx={styles.field}
            onKeyDown={handleSearch}
            {...props}
          />
        </InputGroup>
        {isExpanded ? (
          <IconButton
            aria-label="Collapse search"
            icon={<BiX />}
            variant="clear"
            colorScheme="secondary"
            onClick={() => {
              setIsExpanded(false)
              if (onCollapse) onCollapse()
            }}
            sx={styles.icon}
            marginLeft="2px"
          />
        ) : (
          <></>
        )}
      </Flex>
    )
  },
)
