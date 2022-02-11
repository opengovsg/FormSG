import { useCallback, useMemo, useState } from 'react'
import { FormControlOptions, useMultiStyleConfig } from '@chakra-ui/react'
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
  placeholder = 'Select an option',
  clearButtonLabel = 'Clear dropdown',
  isClearable = true,
  isSearchable = true,
  defaultIsOpen,
  isInvalid,
  isReadOnly,
  isDisabled,
  isRequired,
  children,
}: MultiSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })
  const [inputValue, setInputValue] = useState(defaultInputValue ?? '')
  const [isFocused, setIsFocused] = useState(false)

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
    toggleMenu,
    isOpen,
    getLabelProps,
    getComboboxProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getToggleButtonProps,
    highlightedIndex,
    selectItem,
    selectedItem,
  } = useCombobox({
    items: filteredItems,
    inputValue,
    onInputValueChange: ({ inputValue }) => setInputValue(inputValue ?? ''),
    defaultIsOpen,
    selectedItem: null,
  })

  const {
    getSelectedItemProps,
    getDropdownProps,
    activeIndex,
    addSelectedItem,
    removeSelectedItem,
    selectedItems,
    setSelectedItems,
  } = useMultipleSelection<typeof items[0]>({
    defaultSelectedItems: getDefaultSelectedItems(),
    onSelectedItemsChange: ({ selectedItems }) => {
      onChange(selectedItems?.map(itemToValue) ?? [])
    },
    itemToString: itemToLabelString,
  })

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return !!selectedItem && itemToValue(selectedItem) === itemToValue(item)
    },
    [selectedItem],
  )

  const styles = useMultiStyleConfig('MultiSelect', { isClearable })

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
        isInvalid,
        isDisabled,
        isReadOnly,
        isRequired,
        name,
        clearButtonLabel,
        placeholder,
        styles,
        isFocused,
        setIsFocused,
      }}
    >
      <MultiSelectContext.Provider
        value={{
          selectedItems,
          getDropdownProps,
          getSelectedItemProps,
          activeIndex,
        }}
      >
        {children}
      </MultiSelectContext.Provider>
    </SelectContext.Provider>
  )
}
