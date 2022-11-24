import { KeyboardEvent, useCallback, useRef, useState } from 'react'
import { BiCheck, BiFilter, BiSearch, BiX } from 'react-icons/bi'
import {
  Button,
  Divider,
  Flex,
  forwardRef,
  Icon,
  InputProps,
  MenuButton,
  Stack,
  Text,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { SEARCHBAR_THEME_KEY } from '~/theme/components/Searchbar'

import Input from '~components/Input'
import Menu from '~components/Menu'

import IconButton from '../IconButton'

export interface SearchbarProps extends Omit<InputProps, 'onChange'> {
  /**
   * Optional. Function to be invoked when user presses enter (to search) or
   * clicks the 'search' icon. Note: at least one of onSearch and onChange must
   * be provided for the searchbar to work properly!
   * @param searchValue value of the search input
   */
  onSearch?: (searchValue: string) => void

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
   * Optional. Function to be invoked when the value in the searchbar input
   * changes (but the search button has not been clicked). Note: at least one of
   * onSearch and onChange must be provided for the searchbar to work properly!
   * @param newValue value of the search input
   */
  onChange?: (newValue: string) => void

  /**
   * Optional. If provided, adds a filter button to the searchbar. The initial
   * (default) value of the filter, which is most likely the option for "No filter".
   */
  filterValue?: string

  /**
   * Optional. The remainder of the filter options, not including the default
   * filterValue. Will be ignored unless filterValue has been provided.
   */
  filterOptions?: string[]

  /**
   * Optional. Function to be invoked when a filter option has been selected.
   * Will be ignored unless filterValue has been provided.
   * @param filterValue the option that was selected
   */
  onFilter?: (filterValue: string) => void
}

export const Searchbar = forwardRef<SearchbarProps, 'input'>(
  (
    {
      onSearch,
      isExpandable = true,
      isExpanded: isExpandedProp = false,
      onExpandIconClick: onExpandIconClickProp,
      onCollapseIconClick: onCollapseIconClickProp,
      value: valueProp,
      onChange: onChangeProp,
      isDisabled,
      filterValue = '',
      filterOptions = [],
      onFilter,
      ...props
    }: SearchbarProps,
    ref,
  ) => {
    const [value, setValue] = useState<string | undefined>(valueProp)
    const [isExpanded, setIsExpanded] = useState(
      !isExpandable || isExpandedProp,
    )
    const [filter, setFilter] = useState<string>(filterValue)
    const [focus, setFocus] = useState<boolean>(false)

    const styles = useMultiStyleConfig(SEARCHBAR_THEME_KEY, {
      isExpanded,
      isDisabled,
      ...props,
    })

    const innerRef = useRef<HTMLInputElement>(null)
    const inputRef = useMergeRefs(innerRef, ref)

    const onExpandIconClick = () => {
      if (onExpandIconClickProp) onExpandIconClickProp()
      setIsExpanded(true)
    }

    const onCollapseIconClick = () => {
      if (onCollapseIconClickProp) onCollapseIconClickProp()
      setValue(undefined)
      setIsExpanded(false)
    }

    const onChange = (newValue: string) => {
      if (onChangeProp) onChangeProp(newValue)
      setValue(newValue)
    }

    const handleClickSearch = useCallback(
      () => (onSearch && value !== undefined ? onSearch(value) : null),
      [onSearch, value],
    )

    const handleEnterKeySearch = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) =>
        e.key === 'Enter' && onSearch && value !== undefined
          ? onSearch(value)
          : null,
      [onSearch, value],
    )

    if (!isExpanded) {
      return (
        <IconButton
          aria-label="Expand searchbar"
          icon={<BiSearch fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          onClick={onExpandIconClick}
          sx={styles.icon}
        />
      )
    }

    return (
      <Flex
        border={focus ? '2px' : '1px'}
        borderStyle="solid"
        borderRadius="0.25rem"
        borderColor={focus ? 'primary.500' : 'neutral.400'}
        transition="0.2s ease"
        align="center"
      >
        <Flex px="0.75rem">
          {onSearch ? (
            <IconButton
              aria-label="Search"
              isDisabled={isDisabled}
              size="sm"
              variant="clear"
              colorScheme="secondary"
              icon={<BiSearch fontSize="1.25rem" />}
              onClick={handleClickSearch}
            />
          ) : (
            <Icon as={BiSearch} px="0.75rem" fontSize="1.25rem" />
          )}
        </Flex>
        <Input
          aria-label={
            onSearch ? 'Press enter to search' : 'Type something to search'
          }
          ref={inputRef}
          sx={{
            ...styles.field,
            paddingInlineStart: 'none',
            paddingInlineEnd: isExpandable && !filterValue ? 'none' : undefined,
            border: 'none',
            _focus: undefined,
          }}
          value={value}
          flex={1}
          minWidth={0}
          isDisabled={isDisabled}
          onKeyDown={handleEnterKeySearch}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setFocus(false)}
          onFocus={() => setFocus(true)}
        />
        {filterValue && (
          <Flex
            height="1.25rem"
            alignItems="center"
            justifyContent="flex-end"
            direction="row"
            pr={isExpandable ? undefined : '0.5rem'}
          >
            <Divider orientation="vertical" mr="0.5rem" />
            <Menu placement="bottom-end">
              {({ isOpen }) => (
                <>
                  <MenuButton
                    as={Button}
                    size="sm"
                    variant="clear"
                    colorScheme="secondary"
                    isActive={isOpen}
                    aria-label="Filter forms"
                    leftIcon={<BiFilter />}
                    px="9px"
                  >
                    {filter === filterValue ? 'Filter' : filter}
                  </MenuButton>
                  <Menu.List>
                    {[filterValue, ...filterOptions].map((option) => (
                      <Menu.Item onClick={() => setFilter(option)}>
                        <Stack
                          direction="row"
                          justify="space-between"
                          alignItems="center"
                          w="100%"
                        >
                          <Text>{option}</Text>
                          {filter === option ? <BiCheck /> : null}
                        </Stack>
                      </Menu.Item>
                    ))}
                  </Menu.List>
                </>
              )}
            </Menu>
          </Flex>
        )}
        {isExpandable && (
          <Flex px="0.75rem">
            <IconButton
              aria-label="Collapse searchbar"
              isDisabled={isDisabled}
              size="sm"
              variant="clear"
              colorScheme="secondary"
              icon={<BiX fontSize="1.25rem" />}
              onClick={onCollapseIconClick}
            />
          </Flex>
        )}
      </Flex>
    )
  },
)
