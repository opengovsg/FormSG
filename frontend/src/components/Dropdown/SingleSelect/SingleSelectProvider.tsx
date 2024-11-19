import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VirtuosoHandle } from 'react-virtuoso'
import {
  FormControlOptions,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox, UseComboboxProps } from 'downshift'

import { ThemeColorScheme } from '~theme/foundations/colours'

import { VIRTUAL_LIST_MAX_HEIGHT } from '../constants'
import { useItems } from '../hooks/useItems'
import { SelectContext, SharedSelectContextReturnProps } from '../SelectContext'
import { ComboboxItem } from '../types'
import { defaultFilter } from '../utils/defaultFilter'
import { isItemDisabled, itemToValue } from '../utils/itemUtils'

export interface SingleSelectProviderProps<
  Item extends ComboboxItem = ComboboxItem,
> extends SharedSelectContextReturnProps<Item>,
    FormControlOptions {
  /** Controlled selected value */
  value: string
  /** Controlled selected item onChange handler */
  onChange: (value: string) => void
  onBlur?: () => void
  /** Function based on which items in dropdown are filtered. Default filter filters by fuzzy match. */
  filter?: (items: Item[], value: string) => Item[]
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
  /** Color scheme of component */
  colorScheme?: ThemeColorScheme
  /** Variant of component */
  variant?: 'clear'
  fullWidth?: boolean
}
export const SingleSelectProvider = ({
  items: rawItems,
  value,
  onBlur,
  onChange,
  name,
  filter = defaultFilter,
  nothingFoundLabel = 'No matching results',
  placeholder: placeholderProp,
  clearButtonLabel = 'Clear selection',
  isClearable = true,
  isSearchable = true,
  initialIsOpen,
  isInvalid: isInvalidProp,
  isReadOnly: isReadOnlyProp,
  isDisabled: isDisabledProp,
  isRequired: isRequiredProp,
  children,
  inputAria,
  colorScheme,
  comboboxProps = {},
  variant,
  fullWidth = false,
}: SingleSelectProviderProps): JSX.Element => {
  const { items, getItemByValue } = useItems({ rawItems })
  const [isFocused, setIsFocused] = useState(false)
  const { t } = useTranslation()

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
    return placeholderProp ?? t('features.common.dropdown.placeholder')
  }, [placeholderProp, t])

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

  const virtualListRef = useRef<VirtuosoHandle>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    toggleMenu,
    closeMenu,
    isOpen,
    getLabelProps,
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
      if (!selectedItem || !isItemDisabled(selectedItem)) {
        onChange(itemToValue(selectedItem))
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    scrollIntoView: () => {},
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      if (
        highlightedIndex !== undefined &&
        highlightedIndex >= 0 &&
        virtualListRef.current
      ) {
        virtualListRef.current.scrollIntoView({
          index: highlightedIndex,
        })
      }
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
    stateReducer: (state, { changes, type }) => {
      switch (type) {
        // Handle controlled `value` prop changes.
        case useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem:
          // Do nothing if selectedItem is null but yet previous state has inputValue.
          // This suggests that there is some initial input state that we want to keep.
          // This can only happen on first mount, since inputValue will be empty string
          // on future actions.
          if (state.inputValue && !changes.selectedItem) {
            return { ...changes, inputValue: state.inputValue }
          }
          return {
            ...changes,
            // Clear inputValue on item selection
            inputValue: '',
          }
        case useCombobox.stateChangeTypes.InputKeyDownEscape: {
          if (isClearable) return changes
          return {
            ...changes,
            selectedItem: state.selectedItem,
          }
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
        case useCombobox.stateChangeTypes.InputFocus:
          return {
            ...changes,
            isOpen: false, // keep the menu closed when input gets focused.
          }
        case useCombobox.stateChangeTypes.ToggleButtonClick:
          return {
            ...changes,
            isOpen: !state.isOpen,
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
    colorScheme,
    variant,
  })

  const virtualListHeight = useMemo(() => {
    const itemHeight = 48
    const totalHeight = filteredItems.length * itemHeight
    // If the total height is less than the max height, just return the total height.
    // Otherwise, return the max height.
    return Math.min(totalHeight, VIRTUAL_LIST_MAX_HEIGHT)
  }, [filteredItems.length])

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        selectedItem,
        isItemSelected,
        toggleMenu,
        closeMenu,
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
        inputRef,
        virtualListRef,
        virtualListHeight,
        fullWidth,
        onBlur,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}
