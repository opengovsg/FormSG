import { KeyboardEvent, useCallback, useRef, useState } from 'react'
import { BiSearch, BiX } from 'react-icons/bi'
import {
  forwardRef,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { SEARCHBAR_THEME_KEY } from '~/theme/components/Searchbar'

import IconButton from '../IconButton'

export interface SearchbarProps extends Omit<InputProps, 'onChange'> {
  /**
   * Function to be invoked when user presses enter (to search) or clicks the
   * 'search' icon.
   * @param searchValue value of the search input
   */
  onSearch: (searchValue: string) => void

  /**
   * Whether the searchbar is expandable and collapsable.
   * If this is `false`, the searchbar will be permanently expanded,
   * regardless of the value passed for isExpanded.
   * @defaultValue `true`
   */
  isExpandable?: boolean

  /**
   * Whether the searchbar is initially expanded or not.
   * This value will be overridden and set to `true` if `isExpandable` is
   * `false` (otherwise, the searchbar will not be usable).
   * @defaultValue `false`
   */
  isExpanded?: boolean

  /**
   * Optional. Function to be invoked when the 'expand' search icon is clicked.
   * Ignored if `isExpandable` is set to `false`.
   */
  onExpandIconClick?: () => void

  /**
   * Optional. Function to be invoked when the 'collapse' X icon is clicked.
   * Ignored if `isExpandable` is set to `false`. Note that this clears any
   * value from the searchbar input but *does not* call `onValueChange`.
   */
  onCollapseIconClick?: () => void

  /**
   * Initial value in the searchbar input.
   */
  value?: string

  /**
   * Function to be invoked when the value in the searchbar input changes (but
   * the search button has not been clicked).
   */
  onChange?: (newValue: string) => void
}

export const Searchbar = forwardRef<SearchbarProps, 'input'>(
  (
    {
      onSearch,
      isExpandable = true,
      isExpanded = false,
      onExpandIconClick: onExpandIconClickProp,
      onCollapseIconClick: onCollapseIconClickProp,
      value: valueProp,
      onChange: onChangeProp,
      isDisabled,
      ...props
    }: SearchbarProps,
    ref,
  ) => {
    const [value, setValue] = useState<string | undefined>(valueProp)

    const [innerIsExpanded, setInnerIsExpanded] = useState<boolean>(
      isExpandable ? isExpanded : true,
    )

    const styles = useMultiStyleConfig(SEARCHBAR_THEME_KEY, {
      isExpanded: innerIsExpanded,
      isDisabled,
      ...props,
    })

    const innerRef = useRef<HTMLInputElement>(null)
    const inputRef = useMergeRefs(innerRef, ref)

    const onExpandIconClick = () => {
      if (onExpandIconClickProp) onExpandIconClickProp()
      setInnerIsExpanded(true)
    }

    const onCollapseIconClick = () => {
      if (onCollapseIconClickProp) onCollapseIconClickProp()
      setValue('')
      setInnerIsExpanded(false)
    }

    const onChange = (newValue: string) => {
      if (onChangeProp) onChangeProp(newValue)
      setValue(newValue)
    }

    const handleClickSearch = useCallback(
      () => (value !== undefined ? onSearch(value) : null),
      [onSearch, value],
    )

    const handleEnterKeySearch = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) =>
        e.key === 'Enter' && value !== undefined ? onSearch(value) : null,
      [onSearch, value],
    )

    return (
      <InputGroup flex={innerIsExpanded ? 1 : 0}>
        {innerIsExpanded ? (
          <InputLeftElement>
            <IconButton
              aria-label="Search"
              isDisabled={isDisabled}
              size="sm"
              variant="clear"
              colorScheme="sub"
              icon={<BiSearch fontSize="1.25rem" />}
              onClick={handleClickSearch}
            />
          </InputLeftElement>
        ) : (
          <IconButton
            aria-label="Expand searchbar"
            icon={<BiSearch fontSize="1.25rem" />}
            variant="clear"
            colorScheme="sub"
            onClick={onExpandIconClick}
            sx={styles.icon}
          />
        )}
        <Input
          aria-label="Press enter to search"
          ref={inputRef}
          sx={styles.field}
          onKeyDown={handleEnterKeySearch}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          isDisabled={isDisabled}
          {...props}
        />
        {isExpandable && innerIsExpanded && (
          <InputRightElement>
            <IconButton
              aria-label="Collapse searchbar"
              isDisabled={isDisabled}
              size="sm"
              variant="clear"
              colorScheme="sub"
              icon={<BiX fontSize="1.25rem" />}
              onClick={onCollapseIconClick}
            />
          </InputRightElement>
        )}
      </InputGroup>
    )
  },
)
