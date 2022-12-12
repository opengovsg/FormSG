import { KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react'
import { BiCheck, BiFilter, BiSearch, BiX } from 'react-icons/bi'
import {
  ButtonGroup,
  Circle,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  forwardRef,
  Icon,
  InputProps,
  MenuButton,
  Stack,
  Text,
  useDisclosure,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import type { RequireAtLeastOne } from 'type-fest'

import { SEARCHBAR_THEME_KEY } from '~/theme/components/Searchbar'

import { useIsMobile } from '~hooks/useIsMobile'
import Button, { ButtonProps } from '~components/Button'
import Input from '~components/Input'
import Menu from '~components/Menu'

import IconButton from '../IconButton'

interface _SearchbarProps extends Omit<InputProps, 'onChange'> {
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
   * regardless of the value passed for isExpanded. Note that any search input
   * and filters will be cleared when the searchbar is collapsed.
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
   * Ignored if `isExpandable` is set to `false`.
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
   * Optional. The initial (default) value of the filter. Will typically be the
   * option for "No filter". If omitted, the filter will default to the first
   * value of `filterOptions`.
   */
  filterValue?: string

  /**
   * Optional. The filter options. An array of length at least 1 is required for
   * the filter button to be shown, along with `onFilter`.
   */
  filterOptions?: string[]

  /**
   * Optional. Function to be invoked when a filter option has been selected.
   * Required for the filter button to be shown, along with `filterOptions`
   * @param filterValue the option that was selected
   */
  onFilter?: (filterValue: string) => void
}

export type SearchbarProps = RequireAtLeastOne<
  _SearchbarProps,
  'onSearch' | 'onChange'
>

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
      filterValue: filterValueProp,
      filterOptions = [],
      onFilter,
      ...props
    }: SearchbarProps,
    ref,
  ) => {
    const isMobile = useIsMobile()

    const initialFilterValue = useMemo(
      () => filterValueProp ?? filterOptions[0] ?? '',
      [filterOptions, filterValueProp],
    )

    const [value, setValue] = useState<string>(valueProp ?? '')
    const [isExpanded, setIsExpanded] = useState(
      !isExpandable || isExpandedProp,
    )
    const [filterValue, setFilterValue] = useState<string>(initialFilterValue)
    const [focus, setFocus] = useState<boolean>(false)

    const { isOpen, onClose, onOpen } = useDisclosure()

    const styles = useMultiStyleConfig(SEARCHBAR_THEME_KEY, {
      isExpanded,
      isDisabled,
      ...props,
    })

    const mobileDrawerExtraButtonProps: Partial<ButtonProps> = useMemo(
      () => ({
        isFullWidth: true,
        justifyContent: 'flex-start',
        variant: 'clear',
        colorScheme: 'secondary',
        textStyle: 'body-1',
      }),
      [],
    )

    const isFilterButtonShown = useMemo(
      () => filterOptions.length !== 0 && onFilter,
      [filterOptions.length, onFilter],
    )

    const isFilterActive = useMemo(
      () => filterValue !== initialFilterValue,
      [filterValue, initialFilterValue],
    )

    const renderFilterButton = useCallback(
      (option: string): JSX.Element => {
        return (
          <Stack
            direction="row"
            justify="space-between"
            alignItems="center"
            w="100%"
          >
            <Text>{option}</Text>
            {filterValue === option ? <BiCheck /> : null}
          </Stack>
        )
      },
      [filterValue],
    )

    const innerRef = useRef<HTMLInputElement>(null)
    const inputRef = useMergeRefs(innerRef, ref)

    const onExpandIconClick = () => {
      if (onExpandIconClickProp) onExpandIconClickProp()
      setIsExpanded(true)
    }

    const onCollapseIconClick = () => {
      if (onCollapseIconClickProp) onCollapseIconClickProp()
      setValue('')
      setFilterValue(initialFilterValue)
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

    const onFilterSelect = useCallback(
      (option: string) => {
        if (onFilter) onFilter(option)
        setFilterValue(option)
      },
      [onFilter],
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
        margin={focus ? '-2px' : '-1px'}
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
            <Flex>
              <BiSearch fontSize="1.25rem" />
            </Flex>
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
            paddingInlineEnd:
              isExpandable && !isFilterButtonShown ? 'none' : undefined,
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
        {isFilterButtonShown && (
          <Flex
            height="1.25rem"
            alignItems="center"
            justifyContent="flex-end"
            direction="row"
            pr={isExpandable ? undefined : '0.5rem'}
          >
            <Divider orientation="vertical" mr="0.5rem" />
            {isMobile ? (
              <>
                <IconButton
                  aria-label="Filter forms"
                  variant="clear"
                  colorScheme="secondary"
                  size="sm"
                  backgroundColor={isFilterActive ? 'neutral.200' : undefined}
                  onClick={onOpen}
                  icon={<BiFilter />}
                />
                {isFilterActive && (
                  <Icon
                    as={Circle}
                    bg="primary.500"
                    fontSize="0.4rem"
                    ml="-0.5rem"
                    mr="0.1rem"
                    mb="0.6rem"
                    zIndex={0}
                  />
                )}
              </>
            ) : (
              <Menu placement="bottom-end">
                {({ isOpen }) => (
                  <>
                    <MenuButton
                      as={Button}
                      size="sm"
                      variant="clear"
                      colorScheme="secondary"
                      backgroundColor={
                        isFilterActive ? 'neutral.200' : undefined
                      }
                      isActive={isOpen}
                      aria-label="Filter forms"
                      leftIcon={<BiFilter />}
                      px="9px"
                    >
                      {isFilterActive ? filterValue : 'Filter'}
                    </MenuButton>
                    <Menu.List>
                      {filterOptions.map((option, i) => (
                        <Menu.Item
                          key={i}
                          onClick={() => onFilterSelect(option)}
                        >
                          {renderFilterButton(option)}
                        </Menu.Item>
                      ))}
                    </Menu.List>
                  </>
                )}
              </Menu>
            )}
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

        {/* Drawer for filter in mobile */}
        {isFilterButtonShown && isMobile && (
          <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
            <DrawerOverlay />
            <DrawerContent borderTopRadius="0.25rem">
              <DrawerBody px={0} py="0.5rem">
                <ButtonGroup flexDir="column" spacing={0} w="100%">
                  {filterOptions.map((option, i) => (
                    <Button
                      key={i}
                      {...mobileDrawerExtraButtonProps}
                      onClick={() => {
                        onFilterSelect(option)
                        onClose()
                      }}
                    >
                      {renderFilterButton(option)}
                    </Button>
                  ))}
                </ButtonGroup>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}
      </Flex>
    )
  },
)
