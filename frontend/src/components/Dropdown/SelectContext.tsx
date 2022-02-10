import { createContext, useContext } from 'react'

import { ComboboxItem } from './types'

interface SelectContextReturn {
  isOpen: boolean
  selectedItem?: ComboboxItem
  isItemSelected: (item: ComboboxItem) => boolean
  toggleMenu: () => void
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
