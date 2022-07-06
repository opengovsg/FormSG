import { KeyboardEvent, useCallback, useRef } from 'react'
import { BiSearch } from 'react-icons/bi'
import {
  forwardRef,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  useControllableState,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { SEARCHBAR_THEME_KEY } from '~/theme/components/Searchbar'

import IconButton from '../IconButton'

export interface SearchbarProps extends Omit<InputProps, 'onChange'> {
  /**
   * Function to be invoked when user presses enter (to search).
   * @param searchValue value of the search input
   */
  onSearch: (searchValue: string) => void

  /**
   * Whether the searchbar is expanded or not.
   * @note This should be `true` if the `onSearchIconClick` function prop is not
   * provided, or the searchbar will not be usable.
   */
  isExpanded: boolean

  /**
   * Optional. Function to be invoked when the search icon is clicked.
   * If provided, the search icon will be clickable.
   */
  onSearchIconClick?: () => void

  defaultValue?: string
  onChange?: (newValue: string) => void
  value?: string

  rightElement?: React.ReactElement
}

export const Searchbar = forwardRef<SearchbarProps, 'input'>(
  (
    {
      onSearch,
      isExpanded,
      onSearchIconClick,
      rightElement,
      onChange: onChangeProp,
      value: valueProp,
      defaultValue: defaultValueProp,
      isDisabled,
      ...props
    },
    ref,
  ) => {
    const [value, onChange] = useControllableState<string>({
      defaultValue: defaultValueProp ?? '',
      onChange: onChangeProp,
      value: valueProp,
    })
    const innerRef = useRef<HTMLInputElement>(null)
    const styles = useMultiStyleConfig(SEARCHBAR_THEME_KEY, {
      isExpanded,
      isDisabled,
      ...props,
    })

    const inputRef = useMergeRefs(innerRef, ref)

    const handleSearch = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          onSearch(value)
        }
      },
      [onSearch, value],
    )

    return (
      <InputGroup flex={isExpanded ? 1 : 0}>
        {isExpanded ? (
          <InputLeftElement>
            <IconButton
              isDisabled={isDisabled}
              size="sm"
              variant="clear"
              colorScheme="secondary"
              aria-label="Search"
              icon={<BiSearch fontSize="1.25rem" />}
              onClick={() => onSearch(value)}
            />
          </InputLeftElement>
        ) : (
          <IconButton
            aria-label="Expand search"
            icon={<BiSearch />}
            variant="clear"
            colorScheme="secondary"
            onClick={onSearchIconClick}
            sx={styles.icon}
          />
        )}
        <Input
          aria-label="Press enter to search"
          ref={inputRef}
          sx={styles.field}
          onKeyDown={handleSearch}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          isDisabled={isDisabled}
          {...props}
        />
        {isExpanded && rightElement}
      </InputGroup>
    )
  },
)
