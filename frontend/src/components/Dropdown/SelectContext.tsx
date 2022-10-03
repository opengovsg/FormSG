import { createContext, MutableRefObject, RefObject, useContext } from 'react'
import { VirtuosoHandle } from 'react-virtuoso'
import { CSSObject, FormControlOptions } from '@chakra-ui/react'
import { UseComboboxPropGetters, UseComboboxState } from 'downshift'

import { ComboboxItem } from './types'

export interface SharedSelectContextReturnProps<
  Item extends ComboboxItem = ComboboxItem,
> {
  /** Set to true to enable search, defaults to `true` */
  isSearchable?: boolean
  /** Set to true to allow clearing of input, defaults to `true` */
  isClearable?: boolean
  /** Nothing found label. Defaults to "No matching results" */
  nothingFoundLabel?: string
  /** aria-label for clear button. Defaults to "Clear selection" */
  clearButtonLabel?: string
  /**
   * Placeholder to show in the input field.
   * Defaults to "Select an option".
   * Set to `null` to hide the placeholder.
   */
  placeholder?: string | null
  /** ID of input itself, for a11y purposes */
  name: string
  /** Item data used to render items in dropdown */
  items: Item[]
  /** aria-describedby to be attached to the combobox input, if any. */
  inputAria?: {
    id: string
    label: string
  }
}

interface SelectContextReturn<Item extends ComboboxItem = ComboboxItem>
  extends UseComboboxPropGetters<Item>,
    UseComboboxState<Item>,
    Required<SharedSelectContextReturnProps<Item>>,
    FormControlOptions {
  isItemSelected: (item: ComboboxItem) => boolean
  closeMenu: () => void
  toggleMenu: () => void
  selectItem: (item: Item) => void
  styles: Record<string, CSSObject>
  isFocused: boolean
  setIsFocused: (isFocused: boolean) => void
  inputRef?: MutableRefObject<HTMLInputElement | null>
  resetInputValue: () => void
  /** Ref for list virtualization */
  virtualListRef: RefObject<VirtuosoHandle>
  /** Height to assign to virtual list */
  virtualListHeight: number
}

export const SelectContext = createContext<SelectContextReturn | undefined>(
  undefined,
)

export const useSelectContext = () => {
  const context = useContext(SelectContext)

  if (context === undefined) {
    throw new Error(
      `useSelectContext must be used within a SelectContextProvider`,
    )
  }

  return context
}
