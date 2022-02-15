import { useCallback, useMemo, useState } from 'react'
import { FormControlOptions, useMultiStyleConfig } from '@chakra-ui/react'
import { useCombobox, UseComboboxProps } from 'downshift'

import { useItems } from '../hooks/useItems'
import { SelectContext, SharedSelectContextReturnProps } from '../SelectContext'
import { ComboboxItem } from '../types'
import { defaultFilter } from '../utils/defaultFilter'
import { itemToValue } from '../utils/itemUtils'

export interface SingleSelectProviderProps<
  Item extends ComboboxItem = ComboboxItem,
> extends SharedSelectContextReturnProps<Item>,
    FormControlOptions {
  /** Controlled input value */
  value: string
  /** Controlled input onChange handler */
  onChange: (value: string) => void
  /** Function based on which items in dropdown are filtered. Default filter filters by fuzzy match. */
  filter?(items: Item[], value: string): Item[]
  /** Initial dropdown opened state. Defaults to `false`. */
  defaultIsOpen?: boolean
  /** Props to override default useComboboxProps, if any. */
  comboboxProps?: Partial<UseComboboxProps<Item>>
  children: React.ReactNode
}
export const SingleSelectProvider = ({
  items: rawItems,
  value,
  onChange,
  name,
  filter = defaultFilter,
  nothingFoundLabel = 'No matching results',
  placeholder = 'Select an option',
  clearButtonLabel = 'Clear dropdown input',
  isClearable = true,
  isSearchable = true,
  defaultIsOpen,
  isInvalid,
  isReadOnly,
  isDisabled,
  isRequired,
  children,
  comboboxProps = {},
}: SingleSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })
  const [isFocused, setIsFocused] = useState(false)

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
    selectItem,
    selectedItem,
  } = useCombobox({
    labelId: `${name}-label`,
    inputId: name,
    items: filteredItems,
    inputValue: value,
    defaultIsOpen,
    onInputValueChange: ({ inputValue }) => {
      if (!inputValue) {
        selectItem(null)
      }
      onChange(inputValue ?? '')
    },
    defaultSelectedItem: getDefaultSelectedValue(),
    itemToString: itemToValue,
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(itemToValue(selectedItem))
    },
    ...comboboxProps,
  })

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return !!selectedItem && itemToValue(selectedItem) === itemToValue(item)
    },
    [selectedItem],
  )

  const styles = useMultiStyleConfig('SingleSelect', { isClearable })

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
        inputValue: value,
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
      {children}
    </SelectContext.Provider>
  )
}
