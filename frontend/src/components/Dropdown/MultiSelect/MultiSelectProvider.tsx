import { useCallback, useMemo, useState } from 'react'
import {
  FormControlOptions,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox, useMultipleSelection } from 'downshift'

import { useItems } from '../hooks/useItems'
import { MultiSelectContext } from '../MultiSelectContext'
import { SelectContext, SharedSelectContextReturnProps } from '../SelectContext'
import { ComboboxItem } from '../types'
import { defaultFilter } from '../utils/defaultFilter'
import { itemToLabelString, itemToValue } from '../utils/itemUtils'

export interface MultiSelectProviderProps<
  Item extends ComboboxItem = ComboboxItem,
> extends SharedSelectContextReturnProps<Item>,
    FormControlOptions {
  /** Controlled selected values */
  values: string[]
  /** Controlled selection onChange handler */
  onChange: (value: string[]) => void
  /** Default value to populate input on render, if any */
  defaultInputValue?: string
  /** Function based on which items in dropdown are filtered. Default filter filters by fuzzy match. */
  filter?(items: Item[], value: string): Item[]
  /** Initial dropdown opened state. Defaults to `false`. */
  defaultIsOpen?: boolean
  /**
   * The maximum number of selected items to render while multiselect is unfocused.
   * Defaults to `4`. Set to `null` to render all items.
   */
  maxItems?: number | null

  children: React.ReactNode
}
export const MultiSelectProvider = ({
  items: rawItems,
  values,
  onChange,
  defaultInputValue,
  name,
  filter = defaultFilter,
  nothingFoundLabel = 'No matching results',
  placeholder = 'Select options',
  clearButtonLabel = 'Clear dropdown',
  isClearable = true,
  isSearchable = true,
  defaultIsOpen,
  isInvalid: isInvalidProp,
  isReadOnly: isReadOnlyProp,
  isDisabled: isDisabledProp,
  isRequired: isRequiredProp,
  maxItems = 4,
  children,
}: MultiSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })
  const [inputValue, setInputValue] = useState(defaultInputValue ?? '')
  const [isFocused, setIsFocused] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  const { isInvalid, isDisabled, isReadOnly, isRequired } = useFormControlProps(
    {
      isInvalid: isInvalidProp,
      isDisabled: isDisabledProp,
      isReadOnly: isReadOnlyProp,
      isRequired: isRequiredProp,
    },
  )

  const filteredItems = useMemo(
    () => (inputValue ? filter(items, inputValue) : items),
    [filter, inputValue, items],
  )

  const getDefaultSelectedItems = useCallback(() => {
    return values
      .map((value) => getItemByValue(value)?.item ?? null)
      .filter(Boolean)
  }, [getItemByValue, values])

  const {
    getSelectedItemProps,
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    selectedItems,
    reset,
  } = useMultipleSelection<typeof items[0]>({
    selectedItems: getDefaultSelectedItems(),
    onSelectedItemsChange: ({ selectedItems }) => {
      onChange(selectedItems?.map(itemToValue) ?? [])
    },
    itemToString: itemToLabelString,
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
          return {
            ...changes,
            // The focus will move to the input/button
            // This prevents a bug where the focus would move to a selected item
            // when deselecting a selected item in the dropdown.
            activeIndex: -1,
          }
        default:
          return changes
      }
    },
  })

  const dynamicPlaceholder = useMemo(() => {
    const numSelectedItems = selectedItems.length
    if (numSelectedItems > 0) return ''
    return placeholder ?? 'Select options'
  }, [placeholder, selectedItems.length])

  const {
    toggleMenu,
    isOpen,
    getLabelProps,
    getComboboxProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
    selectItem,
    selectedItem,
  } = useCombobox({
    items: filteredItems,
    inputValue,
    onInputValueChange: ({ inputValue }) => setInputValue(inputValue ?? ''),
    defaultIsOpen,
    selectedItem: null,
    highlightedIndex,
    onStateChange: ({ type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          if (selectedItem) {
            if (selectedItems.includes(selectedItem)) {
              removeSelectedItem(selectedItem)
            } else {
              addSelectedItem(selectedItem)
            }
          }
          setInputValue('')
          break
        default:
          break
      }
    },
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownArrowDown:
        case useCombobox.stateChangeTypes.InputKeyDownArrowUp:
        case useCombobox.stateChangeTypes.ItemMouseMove:
          setHighlightedIndex(changes.highlightedIndex ?? 0)
          return changes
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
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
  })

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return selectedItems.includes(item)
    },
    [selectedItems],
  )

  const styles = useMultiStyleConfig('MultiSelect', {
    isClearable,
    isFocused,
    isEmpty: selectedItems.length === 0,
  })

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        selectedItem,
        isItemSelected,
        toggleMenu,
        getComboboxProps,
        getInputProps,
        getItemProps,
        getLabelProps,
        getMenuProps,
        getToggleButtonProps,
        selectItem,
        highlightedIndex,
        items: filteredItems,
        nothingFoundLabel,
        inputValue,
        isSearchable,
        isClearable,
        name,
        clearButtonLabel,
        placeholder: dynamicPlaceholder,
        styles,
        isFocused,
        setIsFocused,
        isInvalid,
        isDisabled,
        isReadOnly,
        isRequired,
      }}
    >
      <MultiSelectContext.Provider
        value={{
          selectedItems,
          getDropdownProps,
          getSelectedItemProps,
          addSelectedItem,
          removeSelectedItem,
          reset,
          maxItems,
        }}
      >
        {children}
      </MultiSelectContext.Provider>
    </SelectContext.Provider>
  )
}
