import { createContext, useContext } from 'react'
import { UseComboboxPropGetters, UseComboboxState } from 'downshift'

import { ItemWithIndex } from './hooks/useItems'
import { ComboboxItem } from './types'

interface SelectContextReturn<Item extends ComboboxItem = ComboboxItem>
  extends UseComboboxPropGetters<Item>,
    Partial<UseComboboxState<Item>> {
  isOpen: boolean
  isItemSelected: (item: ComboboxItem) => boolean
  toggleMenu: () => void
  mapDropdownItems: (
    callback: (itemElement: ItemWithIndex<Item>) => JSX.Element,
  ) => JSX.Element[]
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
