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
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox, useMultipleSelection } from 'downshift'
import keyBy from 'lodash/keyBy'
import simplur from 'simplur'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

import { ComboboxItem } from '../types'
import { defaultFilter, itemToLabelString } from '../utils'

import { MultiDropdownItem } from './MultiDropdownItem'
import { SelectedItems } from './SelectedItems'

export interface MultiSelectProps<Item = ComboboxItem, Value = string> {
  /** Select data used to renderer items in dropdown */
  items: Item[]

  /** Controlled input values */
  values: Value[]

  /** Controlled input onChange handler */
  onChange(value: Value[]): void

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

  /** aria-label for clear button. Defaults to "Clear selected options" */
  clearButtonLabel?: string

  /** Placeholder to show in the input field. Defaults to "Select options". */
  placeholder?: string

  /** ID of label for tagging input and dropdown to, for a11y purposes */
  labelId?: string
}

export const MultiSelect = ({
  labelId,
  limit,
  nothingFoundLabel = 'No matching results',
  items,
  filter = defaultFilter,
  values,
  onChange,
  defaultIsOpen,
  isClearable = true,
  isSearchable = true,
  placeholder,
  clearButtonLabel = 'Clear selected options',
}: MultiSelectProps): JSX.Element => {
  const [filteredItems, setFilteredItems] = useState(items)
  const [inputValue, setInputValue] = useState('')
  const [trackedHighlightIndex, setTrackedHighlightIndex] = useState(0)

  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  )
  const {
    styles,
    attributes,
    update: updateDropdownPosition,
  } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
  })

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

  const labelToItemMap = useMemo(
    () => keyBy(items, (item) => itemToLabelString(item)),
    [items],
  )

  const getSelectedItemsFromValues = useCallback(() => {
    const selectedItems: ComboboxItem[] = []
    values.forEach((value) => {
      const item = labelToItemMap[value]
      if (item) {
        selectedItems.push(item)
      }
    })
    return selectedItems
  }, [labelToItemMap, values])

  const {
    getSelectedItemProps,
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    selectedItems,
    setSelectedItems,
  } = useMultipleSelection<ComboboxItem>({
    selectedItems: getSelectedItemsFromValues(),
    onSelectedItemsChange: ({ selectedItems }) => {
      onChange(selectedItems?.map(itemToLabelString) ?? [])
      // Recalculate dropdown position on item change, so dropdown and move with the container.
      updateDropdownPosition?.()
    },
    itemToString: itemToLabelString,
  })

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    getItemProps,
    getToggleButtonProps,
    openMenu,
  } = useCombobox({
    labelId,
    inputValue,
    defaultIsOpen,
    selectedItem: null,
    items: filteredItems,
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownArrowDown:
        case useCombobox.stateChangeTypes.InputKeyDownArrowUp:
        case useCombobox.stateChangeTypes.ItemMouseMove:
          setTrackedHighlightIndex(changes.highlightedIndex ?? 0)
          return changes
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            // Keep highlight index same as current.
            highlightedIndex: trackedHighlightIndex,
            // Keep the menu open after selection.
            isOpen: true,
          }
        case useCombobox.stateChangeTypes.InputBlur:
          setInputValue('')
          // Clear input regardless on blur.
          return {
            ...changes,
            inputValue: '',
            isOpen: false,
          }
      }
      return changes
    },
    onStateChange: ({ inputValue, type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.FunctionOpenMenu:
          regenFilteredItems({ inputValue, selectedItem })
          break
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(inputValue ?? '')
          regenFilteredItems({ inputValue, selectedItem })
          break
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          if (selectedItem) {
            if (selectedItems.includes(selectedItem)) {
              removeSelectedItem(selectedItem)
            } else {
              addSelectedItem(selectedItem)
            }
          }
          break
        default:
          break
      }
    },
  })

  const dynamicPlaceholder = useMemo(() => {
    if (placeholder) return placeholder

    const numSelectedItems = selectedItems.length

    return numSelectedItems > 0
      ? simplur`${numSelectedItems} option[|s] selected`
      : 'Select options'
  }, [placeholder, selectedItems.length])

  const style = useMultiStyleConfig('MultiSelect', {
    isClearable,
  })

  const handleMenuOpen = useCallback(() => {
    if (!isOpen) {
      openMenu()
    }
  }, [isOpen, openMenu])

  return (
    <Box ref={setReferenceElement} sx={style.container}>
      <Flex {...getComboboxProps()} flexWrap="wrap" sx={style.fieldwrapper}>
        <SelectedItems
          selectedItems={selectedItems}
          getSelectedItemProps={getSelectedItemProps}
          handleRemoveItem={removeSelectedItem}
        />
        <Flex w="100%">
          <InputGroup>
            <Input
              sx={style.field}
              isReadOnly={!isSearchable}
              placeholder={dynamicPlaceholder}
              {...getInputProps({
                ...getDropdownProps(),
                onFocus: handleMenuOpen,
                onClick: handleMenuOpen,
              })}
            />
            <InputRightElement>
              <Icon
                as={isOpen ? BxsChevronUp : BxsChevronDown}
                sx={style.icon}
                {...getToggleButtonProps(getDropdownProps())}
              />
            </InputRightElement>
          </InputGroup>
          {isClearable ? (
            <IconButton
              variant="clear"
              colorScheme="secondary"
              aria-label={clearButtonLabel}
              icon={<BiX />}
              onClick={() => setSelectedItems([])}
            />
          ) : null}
        </Flex>
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
              <MultiDropdownItem
                key={`${itemToLabelString(item)}${index}`}
                item={item}
                index={index}
                getItemProps={getItemProps}
                isSelected={selectedItems.includes(item)}
                iconStyles={style.icon}
                itemStyles={style.item}
              />
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
