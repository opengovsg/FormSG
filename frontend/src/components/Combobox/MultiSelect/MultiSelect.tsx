import { useCallback, useMemo, useState } from 'react'
import { usePopper } from 'react-popper'
import {
  Box,
  Flex,
  FormControlOptions,
  forwardRef,
  Icon,
  List,
  ListItem,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox, useMultipleSelection } from 'downshift'
import keyBy from 'lodash/keyBy'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Input from '~components/Input'

import { ComboboxItem } from '../types'
import { defaultFilter, itemToLabelString, itemToValue } from '../utils'

import { MultiDropdownItem } from './MultiDropdownItem'
import { SelectedItems } from './SelectedItems'

export interface MultiSelectProps<Item = ComboboxItem, Value = string>
  extends FormControlOptions {
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

  /** Placeholder to show in the input field. Defaults to "Select options". */
  placeholder?: string

  /** Initial input value to populate input with, if available. */
  defaultInputValue?: string

  /** ID of input itself, for a11y purposes */
  name?: string

  /** ID of input itself, for a11y purposes */
  labelId?: string
}

export const MultiSelect = forwardRef<MultiSelectProps, 'input'>(
  (
    {
      name,
      labelId,
      limit,
      nothingFoundLabel = 'No matching results',
      defaultInputValue = '',
      items,
      filter = defaultFilter,
      values = [],
      onChange,
      defaultIsOpen,
      isSearchable = true,
      isInvalid,
      isReadOnly,
      isDisabled,
      placeholder,
    },
    ref,
  ): JSX.Element => {
    const [inputValue, setInputValue] = useState(defaultInputValue)
    const [trackedHighlightIndex, setTrackedHighlightIndex] = useState(0)

    const formControlProps = useFormControlProps({
      isDisabled,
      isInvalid,
      isReadOnly,
    })

    const [referenceElement, setReferenceElement] =
      useState<HTMLDivElement | null>(null)
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
      null,
    )
    const {
      styles: popperStyles,
      attributes: popperAttributes,
      update: updateDropdownPosition,
    } = usePopper(referenceElement, popperElement, {
      placement: 'bottom-start',
    })

    const filteredItems = useMemo(() => {
      if (!inputValue) {
        return limit ? items.slice(0, limit) : items
      }

      const filteredItems = filter(items, inputValue ?? '')
      return limit ? filteredItems.slice(0, limit) : filteredItems
    }, [filter, items, limit, inputValue])

    const valueToItemMap = useMemo(
      () => keyBy(items, (item) => itemToValue(item)),
      [items],
    )

    const getSelectedItemsFromValues = useCallback(() => {
      const selectedItems: ComboboxItem[] = []
      values.forEach((value) => {
        const item = valueToItemMap[value]
        if (item) {
          selectedItems.push(item)
        }
      })
      return selectedItems
    }, [valueToItemMap, values])

    const {
      getSelectedItemProps,
      getDropdownProps,
      addSelectedItem,
      removeSelectedItem,
      selectedItems,
    } = useMultipleSelection<ComboboxItem>({
      selectedItems: getSelectedItemsFromValues(),
      onSelectedItemsChange: ({ selectedItems }) => {
        if (isDisabled) return
        onChange(selectedItems?.map(itemToValue) ?? [])
        // Recalculate dropdown position on item change, so dropdown and move with the container.
        updateDropdownPosition?.()
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

    const {
      isOpen,
      getMenuProps,
      getInputProps,
      getComboboxProps,
      getItemProps,
      getToggleButtonProps,
      toggleMenu,
      highlightedIndex,
    } = useCombobox({
      labelId: labelId ?? `${formControlProps.id}-label`,
      inputId: name,
      inputValue,
      defaultIsOpen,
      highlightedIndex: trackedHighlightIndex,
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
          case useCombobox.stateChangeTypes.InputChange:
            setInputValue(inputValue ?? '')
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
      const numSelectedItems = selectedItems.length
      if (numSelectedItems > 0) return ''
      if (placeholder) return placeholder ?? 'Select options'
    }, [placeholder, selectedItems.length])

    const styles = useMultiStyleConfig('MultiSelect', {})

    return (
      <Box ref={setReferenceElement} sx={styles.container}>
        <Flex
          {...getComboboxProps({
            'aria-invalid': formControlProps.isInvalid,
            readOnly: formControlProps.isReadOnly,
            disabled: formControlProps.isDisabled,
            'aria-expanded': !!isOpen,
          })}
          sx={styles.fieldwrapper}
        >
          <Box
            display="inline-flex"
            flexWrap="wrap"
            flexGrow={1}
            // Margin difference for selected items.
            my="-3px"
            // Padding for dropdown toggle.
            maxW="calc(100% - 2.5rem)"
          >
            <SelectedItems
              isDisabled={
                formControlProps.isDisabled || formControlProps.isReadOnly
              }
              selectedItems={selectedItems}
              getSelectedItemProps={getSelectedItemProps}
              handleRemoveItem={removeSelectedItem}
            />
            <Input
              sx={styles.field}
              {...formControlProps}
              isReadOnly={!isSearchable || formControlProps.isReadOnly}
              placeholder={dynamicPlaceholder}
              {...getInputProps({
                ...getDropdownProps({ ref }),
                onClick: toggleMenu,
              })}
            />
          </Box>
          <Box
            display="inline-flex"
            py="0.3125rem"
            px="0.625rem"
            __css={styles.icon}
            {...getToggleButtonProps({
              disabled: formControlProps.isDisabled,
              readOnly: formControlProps.isReadOnly,
            })}
          >
            <Icon
              as={isOpen ? BxsChevronUp : BxsChevronDown}
              aria-disabled={isDisabled}
            />
          </Box>
        </Flex>
        <Box
          ref={setPopperElement}
          style={popperStyles.popper}
          {...popperAttributes.popper}
          w="100%"
          zIndex="dropdown"
        >
          <List
            {...getMenuProps({
              disabled: formControlProps.isDisabled,
              readOnly: formControlProps.isReadOnly,
              'aria-label': 'Dropdown list',
              hidden: !isOpen,
            })}
            sx={styles.list}
          >
            {isOpen &&
              filteredItems.map((item, index) => (
                <MultiDropdownItem
                  key={`${itemToValue(item)}${index}`}
                  item={item}
                  index={index}
                  getItemProps={getItemProps}
                  isSelected={selectedItems.includes(item)}
                  isHighlighted={index === highlightedIndex}
                  iconStyles={styles.icon}
                  itemStyles={styles.item}
                  inputValue={inputValue}
                />
              ))}
            {isOpen && filteredItems.length === 0 ? (
              <ListItem role="option" sx={styles.emptyItem}>
                {nothingFoundLabel}
              </ListItem>
            ) : null}
          </List>
        </Box>
      </Box>
    )
  },
)
