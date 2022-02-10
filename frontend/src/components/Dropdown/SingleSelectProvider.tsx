import { useCallback, useMemo } from 'react'
import { useCombobox } from 'downshift'

import { useItems } from './hooks/useItems'
import { itemToValue } from './utils/itemUtils'
import { SelectContext } from './SelectContext'
import { ComboboxItem } from './types'

export interface SingleSelectProviderProps<
  Item = ComboboxItem,
  Value = string,
> {
  items: Item[]
  selectedValue: Value
  onValueChange: (value: Value) => void
  children: React.ReactNode
}
export const SingleSelectProvider = ({
  items: rawItems,
  selectedValue,
  onValueChange,
  children,
}: SingleSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems(rawItems)

  const selectedItem = useMemo(
    () => getItemByValue(selectedValue)?.item,
    [getItemByValue, selectedValue],
  )

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return itemToValue(selectedItem) === itemToValue(item)
    },
    [selectedItem],
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
  } = useCombobox({
    items,
    selectedItem,
    onSelectedItemChange: ({ selectedItem }) => {
      onValueChange(itemToValue(selectedItem))
    },
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
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}
