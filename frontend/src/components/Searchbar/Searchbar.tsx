import { useCallback, useEffect, useRef, useState } from 'react'
import { BiSearch } from 'react-icons/bi'
import {
  Box,
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
   * Search value of the input, if any.
   * If this prop is not passed, an internal state is used to keep track of the value.
   */
  value?: string

  /**
   * Whether the searchbar is expanded or not.
   * @note This should be `true` if the `onExpansionChange` function prop is not
   * provided, or the searchbar will not be usable.
   */
  isExpanded: boolean

  /**
   * Function to be invoked when expansion state is changed.
   */
  onExpansionChange?: (isExpanded: boolean) => void
}

export const Searchbar = forwardRef<SearchbarProps, 'input'>(
  ({ value, onSearch, isExpanded, onExpansionChange, ...props }, ref) => {
    const internalInputRef = useRef<HTMLInputElement>(null)
    const [internalValue, setInternalValue] = useState(value ?? '')

    const styles = useMultiStyleConfig(SEARCHBAR_THEME_KEY, {
      isExpanded,
      ...props,
    })

    const inputRef = useMergeRefs(internalInputRef, ref)

    const toggleSearchExpansion = useCallback(() => {
      // Next state will be expanded, focus on search input.
      if (!isExpanded) {
        internalInputRef.current?.focus()
      }
      onExpansionChange?.(!isExpanded)
    }, [isExpanded, onExpansionChange])

    // Update internal value with given value whenever it changes.
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value)
      }
    }, [value])

    return (
      <InputGroup>
        <InputLeftElement
          pointerEvents={onExpansionChange ? 'inherit' : 'none'}
        >
          {onExpansionChange ? (
            <IconButton
              aria-label={isExpanded ? 'Hide search' : 'Expand search'}
              icon={<BiSearch />}
              variant="clear"
              colorScheme="secondary"
              onClick={toggleSearchExpansion}
              sx={styles.icon}
            />
          ) : (
            <Box __css={styles.icon}>
              <Icon as={BiSearch} />
            </Box>
          )}
        </InputLeftElement>
        <Input
          aria-label="Press enter to search"
          ref={inputRef}
          sx={styles.field}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch(internalValue)
            }
          }}
          {...props}
        />
      </InputGroup>
    )
  },
)
