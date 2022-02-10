import { useCallback, useMemo } from 'react'
import { useCombobox } from 'downshift'

import { useItems } from './hooks/useItems'
import { defaultFilter } from './utils/defaultFilter'
import { itemToLabelString, itemToValue } from './utils/itemUtils'
import { SelectContext } from './SelectContext'
import { ComboboxItem } from './types'

export interface SingleSelectProviderProps<Item = ComboboxItem> {
  items: Item[]
  value: string
  onChange: (value: string) => void
  filter?(items: Item[], value: string): Item[]
  /** Nothing found label. Defaults to "No matching results" */
  nothingFoundLabel?: React.ReactNode
  children: React.ReactNode
}
export const SingleSelectProvider = ({
  items: rawItems,
  value,
  onChange,
  filter = defaultFilter,
  nothingFoundLabel = 'No matching results',
  children,
}: SingleSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })

  const filteredItems = useMemo(
    () => (value ? filter(items, value) : items),
    [filter, value, items],
  )

  const getDefaultSelectedValue = useCallback(
    () => getItemByValue(value)?.item ?? null,
    [getItemByValue, value],
  )

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
    selectedItem,
  } = useCombobox({
    items: filteredItems,
    inputValue: value,
    onInputValueChange: ({ inputValue }) => {
      onChange(inputValue ?? '')
    },
    defaultSelectedItem: getDefaultSelectedValue(),
    itemToString: itemToLabelString,
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(itemToValue(selectedItem))
    },
  })

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return itemToValue(selectedItem) === itemToValue(item)
    },
    [selectedItem],
  )

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
        highlightedIndex,
        items: filteredItems,
        nothingFoundLabel,
        inputValue: value,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}
