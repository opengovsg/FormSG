import { createContext, useContext } from 'react'
import { UseComboboxPropGetters, UseComboboxState } from 'downshift'

import { ComboboxItem } from './types'

interface SelectContextReturn<Item extends ComboboxItem = ComboboxItem>
  extends UseComboboxPropGetters<Item>,
    Partial<UseComboboxState<Item>> {
  isOpen: boolean
  isItemSelected: (item: ComboboxItem) => boolean
  toggleMenu: () => void
  items: Item[]
  nothingFoundLabel?: React.ReactNode
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
