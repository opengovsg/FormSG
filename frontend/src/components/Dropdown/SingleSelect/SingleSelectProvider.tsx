import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FormControlOptions,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox, UseComboboxProps } from 'downshift'

import { useItems } from '../hooks/useItems'
import { SelectContext, SharedSelectContextReturnProps } from '../SelectContext'
import { ComboboxItem } from '../types'
import { defaultFilter } from '../utils/defaultFilter'
import { itemToLabelString, itemToValue } from '../utils/itemUtils'

export interface SingleSelectProviderProps<
  Item extends ComboboxItem = ComboboxItem,
> extends SharedSelectContextReturnProps<Item>,
    FormControlOptions {
  /** Controlled selected value */
  value: string
  /** Controlled selected item onChange handler */
  onChange: (value: string) => void
  /** Function based on which items in dropdown are filtered. Default filter filters by fuzzy match. */
  filter?(items: Item[], value: string): Item[]
  /** Initial dropdown opened state. */
  initialIsOpen?: boolean
  /** Props to override default useComboboxProps, if any. */
  comboboxProps?: Partial<UseComboboxProps<Item>>
  /** aria-describedby to be attached to the combobox input, if any. */
  inputAria?: {
    id: string
    label: string
  }
  children: React.ReactNode
}
export const SingleSelectProvider = ({
  items: rawItems,
  value,
  onChange,
  name,
  filter = defaultFilter,
  nothingFoundLabel = 'No matching results',
  placeholder: placeholderProp,
  clearButtonLabel = 'Clear dropdown input',
  isClearable = true,
  isSearchable = true,
  initialIsOpen,
  isInvalid: isInvalidProp,
  isReadOnly: isReadOnlyProp,
  isDisabled: isDisabledProp,
  isRequired: isRequiredProp,
  children,
  inputAria: inputAriaProp,
  comboboxProps = {},
}: SingleSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })
  const [isFocused, setIsFocused] = useState(false)

  const { isInvalid, isDisabled, isReadOnly, isRequired } = useFormControlProps(
    {
      isInvalid: isInvalidProp,
      isDisabled: isDisabledProp,
      isReadOnly: isReadOnlyProp,
      isRequired: isRequiredProp,
    },
  )

  const placeholder = useMemo(() => {
    if (placeholderProp === null) return ''
    return placeholderProp ?? 'Select an option'
  }, [placeholderProp])

  const getFilteredItems = useCallback(
    (filterValue?: string) =>
      filterValue ? filter(items, filterValue) : items,
    [filter, items],
  )
  const [filteredItems, setFilteredItems] = useState(
    getFilteredItems(
      comboboxProps.initialInputValue ?? comboboxProps.inputValue,
    ),
  )

  const memoizedSelectedItem = useMemo(() => {
    return getItemByValue(value)?.item ?? null
  }, [getItemByValue, value])

  const resetItems = useCallback(
    () => setFilteredItems(getFilteredItems()),
    [getFilteredItems],
  )

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
    highlightedIndex,
    selectItem,
    selectedItem,
    inputValue,
    setInputValue,
  } = useCombobox({
    labelId: `${name}-label`,
    inputId: name,
    defaultInputValue: '',
    defaultHighlightedIndex: 0,
    items: filteredItems,
    initialIsOpen,
    selectedItem: memoizedSelectedItem,
    itemToString: itemToValue,
    onSelectedItemChange: ({ selectedItem }) => {
      onChange(itemToValue(selectedItem))
    },
    onStateChange: ({ inputValue, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.FunctionSetInputValue:
        case useCombobox.stateChangeTypes.InputChange:
          setFilteredItems(getFilteredItems(inputValue))
          break
        default:
          return
      }
    },
    stateReducer: (_state, { changes, type }) => {
      switch (type) {
        // Handle controlled `value` prop changes.
        case useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem:
          // Do nothing if selectedItem is null but yet previous state has inputValue.
          // This suggests that there is some initial input state that we want to keep.
          // This can only happen on first mount, since inputValue will be empty string
          // on future actions.
          if (_state.inputValue && !changes.selectedItem) {
            return { ...changes, inputValue: _state.inputValue }
          }
          return {
            ...changes,
            // Clear inputValue on item selection
            inputValue: '',
          }
        case useCombobox.stateChangeTypes.FunctionSelectItem:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.InputBlur:
        case useCombobox.stateChangeTypes.ItemClick: {
          resetItems()
          return {
            ...changes,
            // Clear inputValue on item selection
            inputValue: '',
            isOpen: false,
          }
        }
        default:
          return changes
      }
    },
    ...comboboxProps,
  })

  /** Effect to update filtered items whenever items prop changes. */
  useEffect(() => {
    setFilteredItems(getFilteredItems(inputValue))
  }, [getFilteredItems, inputValue, items])

  const isItemSelected = useCallback(
    (item: ComboboxItem) => {
      return !!selectedItem && itemToValue(selectedItem) === itemToValue(item)
    },
    [selectedItem],
  )

  const resetInputValue = useCallback(() => setInputValue(''), [setInputValue])

  const styles = useMultiStyleConfig('SingleSelect', {
    isClearable,
  })

  const inputAria = useMemo(() => {
    if (inputAriaProp) return inputAriaProp
    let label = 'No option selected'
    if (selectedItem) {
      label = `Option ${itemToLabelString(selectedItem)}, selected`
    }
    return {
      id: `${name}-current-selection`,
      label,
    }
  }, [inputAriaProp, name, selectedItem])

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        selectedItem,
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
        resetInputValue,
        inputAria,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}
