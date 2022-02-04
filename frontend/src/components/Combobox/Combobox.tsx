import { useCallback, useMemo, useState } from 'react'
import {
  Box,
  FormControl,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
} from '@chakra-ui/react'
import { isString } from '@chakra-ui/utils'
import { useCombobox } from 'downshift'
import { matchSorter } from 'match-sorter'

import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

export type ComboboxItem =
  | {
      value: string
      label?: string
      disabled?: boolean
      [key: string]: any
    }
  | string
  | null

export const defaultFilter = <Item extends ComboboxItem>(
  items: Item[],
  value: string,
) => {
  return matchSorter(items, value, { keys: ['value', 'label'] })
}

const itemToString = <Item extends ComboboxItem>(item: Item): string => {
  if (!item) {
    return ''
  }
  if (isString(item)) {
    return item
  }
  return item.label ?? item.value
}

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

  /** Called when dropdown is opened */
  onDropdownOpen?(): void

  /** Called when dropdown is closed */
  onDropdownClose?(): void

  /** Limit amount of items displayed at a time for searchable select */
  limit?: number

  /** Nothing found label */
  nothingFoundLabel?: React.ReactNode

  /** Set to true to enable search */
  isSearchable?: boolean

  /** Allow to clear item */
  isClearable?: boolean

  /** aria-label for clear button */
  clearButtonLabel?: string

  /** Called each time search value changes */
  onSearchChange?(query: string): void

  /** Allow creatable option  */
  isCreatable?: boolean

  /** Function to get create Label */
  getCreateLabel?: (query: string) => React.ReactNode

  /** Function to determine if create label should be displayed */
  shouldCreate?: (query: string, data: Item[]) => boolean

  /** Called when create option is selected */
  onCreate?: (query: string) => void

  /** Change dropdown component, can be used to add native scrollbars */
  dropdownComponent?: any
}

export const Combobox = ({
  items,
  filter = defaultFilter,
  value,
  onChange,
  defaultIsOpen,
}: ComboboxProps): JSX.Element => {
  const [filteredItems, setFilteredItems] = useState(items)

  // To prepopulate selected item if value is provided.
  const defaultSelectedItem = useMemo(
    () => items.find((item) => itemToString(item) === value),
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
        (selectedItem && inputValue === itemToString(selectedItem))
      ) {
        setFilteredItems(items)
      } else {
        const filteredItems = filter(items, inputValue ?? '')
        setFilteredItems(filteredItems)
      }
    },
    [filter, items],
  )

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    openMenu,
    selectedItem,
  } = useCombobox({
    items: filteredItems,
    defaultIsOpen,
    inputValue: value,
    defaultSelectedItem,
    itemToString,
    onInputValueChange: ({ inputValue, selectedItem }) => {
      regenFilteredItems({ inputValue, selectedItem })
      onChange(inputValue ?? '')
    },
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(itemToString(selectedItem ?? ''))
    },
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputBlur: {
          const selectedValue = changes.inputValue
            ? items.find((item) => itemToString(item) === changes.inputValue)
            : undefined
          const updatedInputValue = selectedValue
            ? itemToString(selectedValue)
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

  return (
    <FormControl>
      <FormLabel {...getLabelProps()}>Test</FormLabel>
      <Box {...getComboboxProps()}>
        <InputGroup>
          <Input
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
            <Button
              h="1.75rem"
              size="sm"
              {...getToggleButtonProps({ tabIndex: 0 })}
            >
              {isOpen ? 'Hide' : 'Show'}
            </Button>
          </InputRightElement>
        </InputGroup>
      </Box>
      <Box pb={4} mb={4}>
        <List
          bg="white"
          borderRadius="4px"
          border={isOpen && '1px solid rgba(0,0,0,0.1)'}
          boxShadow="6px 5px 8px rgba(0,50,30,0.02)"
          {...getMenuProps()}
        >
          {isOpen &&
            filteredItems.map((item, index) => (
              <ListItem
                px={2}
                py={1}
                borderBottom="1px solid rgba(0,0,0,0.01)"
                bg={highlightedIndex === index ? 'neutral.300' : 'inherit'}
                key={`${itemToString(item)}${index}`}
                {...getItemProps({ item, index })}
              >
                {itemToString(item)}
              </ListItem>
            ))}
        </List>
      </Box>
      Selected item: {itemToString(selectedItem)}
    </FormControl>
  )
}
