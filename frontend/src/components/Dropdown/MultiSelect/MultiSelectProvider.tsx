import { useCallback, useMemo, useState } from 'react'
import {
  FormControlOptions,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import {
  useCombobox,
  UseComboboxProps,
  useMultipleSelection,
  UseMultipleSelectionProps,
} from 'downshift'

import { useItems } from '../hooks/useItems'
import { MultiSelectContext } from '../MultiSelectContext'
import { SelectContext, SharedSelectContextReturnProps } from '../SelectContext'
import { ComboboxItem } from '../types'
import { defaultFilter } from '../utils/defaultFilter'
import { itemToLabelString, itemToValue } from '../utils/itemUtils'

export interface MultiSelectProviderProps<
  Item extends ComboboxItem = ComboboxItem,
> extends Omit<SharedSelectContextReturnProps<Item>, 'isClearable'>,
    FormControlOptions {
  /** Controlled selected values */
  values: string[]
  /** Controlled selection onChange handler */
  onChange: (value: string[]) => void
  /** The value of the input element */
  inputValue?: string
  /** Controlled input onChange handler */
  onInputValueChange?: (value: string) => void
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
  /**
   * Any props to override the default props of `downshift#useCombobox` set by this component.
   */
  downshiftComboboxProps?: Partial<UseComboboxProps<Item>>
  /**
   * Any props to override the default props of `downshift#useMultipleSelection` set by this component.
   */
  downshiftMultiSelectProps?: Partial<UseMultipleSelectionProps<Item>>
}
export const MultiSelectProvider = ({
  items: rawItems,
  values,
  onChange,
  inputValue = '',
  onInputValueChange,
  name,
  filter = defaultFilter,
  nothingFoundLabel = 'No matching results',
  placeholder = 'Select options',
  clearButtonLabel = 'Clear dropdown',
  isSearchable = true,
  defaultIsOpen,
  isInvalid: isInvalidProp,
  isReadOnly: isReadOnlyProp,
  isDisabled: isDisabledProp,
  isRequired: isRequiredProp,
  maxItems = 4,
  downshiftComboboxProps = {},
  downshiftMultiSelectProps = {},
  children,
}: MultiSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })
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

  const selectedItems = useMemo(() => {
    const items = []
    for (const value of values) {
      const item = getItemByValue(value)
      if (item) {
        items.push(item.item)
      }
    }
    return items
  }, [getItemByValue, values])

  const {
    getSelectedItemProps,
    getDropdownProps,
    addSelectedItem,
    removeSelectedItem,
    reset,
  } = useMultipleSelection<typeof items[0]>({
    selectedItems,
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
    ...downshiftMultiSelectProps,
  })

  const dynamicPlaceholder = useMemo(() => {
    const numSelectedItems = selectedItems.length
    if (numSelectedItems > 0) return ''
    return placeholder ?? 'Select options'
  }, [placeholder, selectedItems.length])

  const {
    toggleMenu,
    closeMenu,
    isOpen,
    getLabelProps,
    getComboboxProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
    selectItem,
  } = useCombobox({
    items: filteredItems,
    inputValue,
    itemToString: itemToLabelString,
    onInputValueChange: ({ inputValue }) => {
      onInputValueChange?.(inputValue ?? '')
    },
    defaultIsOpen,
    selectedItem: null, // Not used in multiselect
    highlightedIndex,
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownArrowDown:
        case useCombobox.stateChangeTypes.InputKeyDownArrowUp:
        case useCombobox.stateChangeTypes.ItemMouseMove:
          setHighlightedIndex(changes.highlightedIndex ?? 0)
          return changes
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick: {
          const { selectedItem } = changes
          if (selectedItem) {
            if (selectedItems.includes(selectedItem)) {
              removeSelectedItem(selectedItem)
            } else {
              addSelectedItem(selectedItem)
            }
          }
          return {
            ...changes,
            inputValue: '',
            // Keep the menu open after selection.
            isOpen: true,
          }
        }
        case useCombobox.stateChangeTypes.InputBlur:
          // Clear input regardless on blur.
          return {
            ...changes,
            inputValue: '',
            isOpen: false,
          }
      }
      return changes
    },
    ...downshiftComboboxProps,
  })

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return selectedItems.includes(item)
    },
    [selectedItems],
  )

  const styles = useMultiStyleConfig('MultiSelect', {
    isFocused,
    isEmpty: selectedItems.length === 0,
  })

  return (
    <SelectContext.Provider
      value={{
        isClearable: false,
        selectedItem: null,
        isOpen,
        isItemSelected,
        toggleMenu,
        closeMenu,
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
