import { createContext, useContext } from 'react'
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
  /** aria-label for clear button. Defaults to "Clear dropdown" */
  clearButtonLabel?: string
  /** Placeholder to show in the input field. Defaults to "Select an option". */
  placeholder?: string
  /** ID of input itself, for a11y purposes */
  name: string
  /** Item data used to render items in dropdown */
  items: Item[]
}

interface SelectContextReturn<Item extends ComboboxItem = ComboboxItem>
  extends UseComboboxPropGetters<Item>,
    UseComboboxState<Item>,
    Required<SharedSelectContextReturnProps<Item>>,
    FormControlOptions {
  isItemSelected: (item: ComboboxItem) => boolean
  toggleMenu: () => void
  selectItem: (item: Item) => void
  styles: Record<string, CSSObject>
  isFocused: boolean
  setIsFocused: (isFocused: boolean) => void
  resetInputValue: () => void
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
