import { useCallback, useMemo, useState } from 'react'
import { BiX } from 'react-icons/bi'
import { usePopper } from 'react-popper'
import {
  Box,
  Flex,
  Icon,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox } from 'downshift'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { ComboboxItem } from './types'
import {
  defaultFilter,
  isItemDisabled,
  itemToDescriptionString,
  itemToLabelString,
} from './utils'

export interface ComboboxProps<Item = ComboboxItem, Value = string> {
  /** Select data used to renderer items in dropdown */
  items: (string | Item)[]

  /** Controlled input value */
  value: Value

  /** Controlled input onChange handler */
  onChange(value: Value): void

  /** Function based on which items in dropdown are filtered */
  filter?(items: Item[], value: string): Item[]

  /** Initial dropdown opened state */
  defaultIsOpen?: boolean

  /** Limit amount of items displayed at a time for searchable select */
  limit?: number

  /** Nothing found label. Defaults to "No matching results" */
  nothingFoundLabel?: React.ReactNode

  /** Set to true to enable search, defaults to `true` */
  isSearchable?: boolean

  /** Allow to clear item, defaults to `true` */
  isClearable?: boolean

  /** aria-label for clear button. Defaults to "Clear dropdown" */
  clearButtonLabel?: string

  // /** Allow creatable option  */
  // isCreatable?: boolean

  // /** Function to get create Label */
  // getCreateLabel?: (query: string) => React.ReactNode

  // /** Function to determine if create label should be displayed */
  // shouldCreate?: (query: string, data: Item[]) => boolean

  // /** Called when create option is selected */
  // onCreate?: (query: string) => void

  /** Placeholder to show in the input field. Defaults to "Select an option". */
  placeholder?: string

  /** ID of label for tagging input and dropdown to, for a11y purposes */
  labelId?: string
}

export const Combobox = ({
  labelId,
  limit,
  nothingFoundLabel = 'No matching results',
  items,
  filter = defaultFilter,
  value,
  onChange,
  defaultIsOpen,
  isClearable = true,
  isSearchable = true,
  placeholder = 'Select an option',
  clearButtonLabel = 'Clear dropdown',
}: ComboboxProps): JSX.Element => {
  const [filteredItems, setFilteredItems] = useState(items)

  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  )
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
  })

  // To prepopulate selected item if value is provided.
  const defaultSelectedItem = useMemo(
    () => items.find((item) => itemToLabelString(item) === value),
    [items, value],
  )

  const regenFilteredItems = useCallback(
    ({
      inputValue,
      selectedItem,
    }: {
      inputValue?: string
      selectedItem?: ComboboxItem
    }) => {
      // Set to show all items when something is already selected, or if input is empty
      if (
        !inputValue ||
        (selectedItem && inputValue === itemToLabelString(selectedItem))
      ) {
        setFilteredItems(limit ? items.slice(0, limit) : items)
      } else {
        const filteredItems = filter(items, inputValue ?? '')
        setFilteredItems(limit ? filteredItems.slice(0, limit) : filteredItems)
      }
    },
    [filter, items, limit],
  )

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    getItemProps,
    getToggleButtonProps,
    openMenu,
    selectedItem,
    selectItem,
  } = useCombobox({
    labelId,
    items: filteredItems,
    defaultIsOpen,
    inputValue: value,
    defaultSelectedItem,
    itemToString: itemToLabelString,
    onInputValueChange: ({ inputValue, selectedItem }) => {
      regenFilteredItems({ inputValue, selectedItem })
      onChange(inputValue ?? '')
    },
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(itemToLabelString(selectedItem ?? ''))
    },
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputBlur: {
          const selectedValue = changes.inputValue
            ? items.find(
                (item) => itemToLabelString(item) === changes.inputValue,
              )
            : undefined
          const updatedInputValue = selectedValue
            ? itemToLabelString(selectedValue)
            : undefined
          onChange(updatedInputValue ?? '')
          return {
            ...changes,
            inputValue: updatedInputValue,
            selectedItem: selectedValue ?? null,
            isOpen: false,
          }
        }
        case useCombobox.stateChangeTypes.FunctionOpenMenu: {
          const { inputValue, selectedItem } = changes
          regenFilteredItems({ inputValue, selectedItem })
          return changes
        }
        default:
          return changes
      }
    },
  })

  const style = useMultiStyleConfig('Combobox', {
    isClearable,
  })

  return (
    <Box ref={setReferenceElement} sx={style.container}>
      <Flex {...getComboboxProps()}>
        <InputGroup>
          <Input
            isReadOnly={!isSearchable}
            sx={style.field}
            placeholder={placeholder}
            {...getInputProps({
              onFocus: () => {
                if (!isOpen) {
                  openMenu()
                }
              },
              onClick: () => {
                if (!isOpen) {
                  openMenu()
                }
              },
            })}
          />
          <InputRightElement>
            <Icon
              as={isOpen ? BxsChevronUp : BxsChevronDown}
              sx={style.chevron}
              {...getToggleButtonProps()}
            />
          </InputRightElement>
        </InputGroup>
        {isClearable ? (
          <IconButton
            sx={style.clearbutton}
            aria-label={clearButtonLabel}
            icon={<BiX />}
            onClick={() => selectItem(null)}
          />
        ) : null}
      </Flex>
      <Box
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        w="100%"
      >
        <List
          {...getMenuProps({
            'aria-label': 'Dropdown list',
          })}
          sx={style.list}
        >
          {isOpen &&
            filteredItems.map((item, index) => (
              <ListItem
                sx={style.item}
                // Data attributes are unique, any value will be truthy.
                // We want to not even have the tag if falsey.
                // This adds _active styling to the item.
                data-active={selectedItem === item || undefined}
                key={`${itemToLabelString(item)}${index}`}
                {...getItemProps({
                  item,
                  index,
                  disabled: isItemDisabled(item),
                })}
              >
                <Text>{itemToLabelString(item)}</Text>
                <Text
                  textStyle="body-2"
                  color={
                    selectedItem === item ? 'secondary.500' : 'secondary.400'
                  }
                >
                  {itemToDescriptionString(item)}
                </Text>
              </ListItem>
            ))}
          {isOpen && filteredItems.length === 0 ? (
            <ListItem role="option" sx={style.emptyItem}>
              {nothingFoundLabel}
            </ListItem>
          ) : null}
        </List>
      </Box>
    </Box>
  )
}
