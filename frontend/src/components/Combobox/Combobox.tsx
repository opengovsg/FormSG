import { useCallback, useMemo, useState } from 'react'
import { usePopper } from 'react-popper'
import {
  Box,
  Flex,
  FormControlOptions,
  forwardRef,
  InputGroup,
  List,
  ListItem,
  StylesProvider,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { useCombobox } from 'downshift'

import Input from '~components/Input'

import { ComboboxClearButton } from './ComboboxClearButton'
import { DropdownItem } from './DropdownItem'
import { LabelIcon } from './LabelIcon'
import { ToggleChevron } from './ToggleChevron'
import { ComboboxItem } from './types'
import {
  defaultFilter,
  itemToIcon,
  itemToLabelString,
  itemToValue,
} from './utils'

export interface ComboboxProps<Item = ComboboxItem, Value = string>
  extends FormControlOptions {
  /** Select data used to renderer items in dropdown */
  items: (string | Item)[]

  /** Controlled input value */
  value: Value

  /** Controlled input onChange handler */
  onChange(value: Value): void

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

  /** aria-label for clear button. Defaults to "Clear dropdown" */
  clearButtonLabel?: string

  /** Placeholder to show in the input field. Defaults to "Select an option". */
  placeholder?: string

  /** ID of label for tagging input and dropdown to, for a11y purposes */
  labelId?: string
}

export const Combobox = forwardRef<ComboboxProps, 'input'>(
  (
    {
      labelId,
      limit,
      nothingFoundLabel = 'No matching results',
      items,
      filter = defaultFilter,
      value = '',
      onChange,
      defaultIsOpen,
      isClearable = true,
      isSearchable = true,
      isInvalid,
      isReadOnly,
      isDisabled,
      placeholder = 'Select an option',
      clearButtonLabel = 'Clear dropdown',
    },
    ref,
  ): JSX.Element => {
    const [referenceElement, setReferenceElement] =
      useState<HTMLDivElement | null>(null)
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
      null,
    )
    const { styles: popperStyles, attributes: popperAttributes } = usePopper(
      referenceElement,
      popperElement,
      { placement: 'bottom-start' },
    )

    // To prepopulate selected item if value is provided.
    const getDefaultSelectedValue = useCallback(
      () => items.find((item) => itemToValue(item) === value),
      [items, value],
    )
    const filteredItems = useMemo(() => {
      if (!value) {
        return limit ? items.slice(0, limit) : items
      }

      const filteredItems = filter(items, value ?? '')
      return limit ? filteredItems.slice(0, limit) : filteredItems
    }, [filter, items, limit, value])

    const {
      isOpen,
      getMenuProps,
      getInputProps,
      getComboboxProps,
      getItemProps,
      getToggleButtonProps,
      openMenu,
      selectedItem,
      selectItem,
      highlightedIndex,
    } = useCombobox({
      labelId,
      items: filteredItems,
      defaultIsOpen,
      inputValue: value,
      defaultSelectedItem: getDefaultSelectedValue(),
      itemToString: itemToLabelString,
      onInputValueChange: ({ inputValue }) => {
        onChange(inputValue ?? '')
      },
      onSelectedItemChange: ({ selectedItem }) => {
        onChange(itemToValue(selectedItem ?? ''))
      },
      stateReducer: (_state, { changes, type }) => {
        switch (type) {
          case useCombobox.stateChangeTypes.InputBlur: {
            return {
              ...changes,
              isOpen: false,
            }
          }
          default:
            return changes
        }
      },
    })

    const styles = useMultiStyleConfig('Combobox', {
      isClearable,
    })

    const selectedItemIcon = useMemo(
      () => itemToIcon(selectedItem),
      [selectedItem],
    )

    const handleMenuOpen = useCallback(() => {
      if (!isOpen) {
        openMenu()
      }
    }, [isOpen, openMenu])

    return (
      <StylesProvider value={styles}>
        <Box ref={setReferenceElement} sx={styles.container}>
          <Flex
            {...getComboboxProps({
              disabled: isDisabled,
              readOnly: isReadOnly,
            })}
          >
            <InputGroup mr="-1px">
              {selectedItemIcon ? <LabelIcon icon={selectedItemIcon} /> : null}
              <Input
                isReadOnly={!isSearchable || isReadOnly}
                isInvalid={isInvalid}
                isDisabled={isDisabled}
                sx={styles.field}
                placeholder={placeholder}
                {...getInputProps({
                  onFocus: handleMenuOpen,
                  onClick: handleMenuOpen,
                  ref,
                })}
              />
              <ToggleChevron
                isOpen={isOpen}
                {...getToggleButtonProps({
                  disabled: isDisabled,
                  readOnly: isReadOnly,
                })}
              />
            </InputGroup>
            {isClearable ? (
              <ComboboxClearButton
                isDisabled={isDisabled}
                aria-label={clearButtonLabel}
                onClick={() => selectItem(null)}
              />
            ) : null}
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
                disabled: isDisabled,
                readOnly: isReadOnly,
                'aria-label': 'Dropdown list',
              })}
              sx={styles.list}
            >
              {isOpen &&
                filteredItems.map((item, index) => (
                  <DropdownItem
                    key={`${itemToValue(item)}${index}`}
                    item={item}
                    index={index}
                    isActive={selectedItem === item || undefined}
                    isHighlighted={highlightedIndex === index}
                    getItemProps={getItemProps}
                    iconStyles={styles.icon}
                    itemStyles={styles.item}
                    inputValue={value}
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
      </StylesProvider>
    )
  },
)
