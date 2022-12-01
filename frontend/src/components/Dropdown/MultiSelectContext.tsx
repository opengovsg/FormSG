// Context provides multi-select handlers. Mostly complemented by SelectContext.
import { createContext, useContext } from 'react'
import {
  UseMultipleSelectionActions,
  UseMultipleSelectionPropGetters,
  UseMultipleSelectionState,
} from 'downshift'

import { ComboboxItem } from './types'

interface MultiSelectContextReturn<Item extends ComboboxItem = ComboboxItem>
  extends UseMultipleSelectionPropGetters<Item>,
    UseMultipleSelectionState<Item>,
    Pick<
      UseMultipleSelectionActions<Item>,
      'reset' | 'addSelectedItem' | 'removeSelectedItem' | 'setActiveIndex'
    > {
  maxItems: number | null
  isSelectedItemFullWidth?: boolean
}

export const MultiSelectContext = createContext<
  MultiSelectContextReturn | undefined
>(undefined)

export const useMultiSelectContext = () => {
  const context = useContext(MultiSelectContext)

  if (context === undefined) {
    throw new Error(
      `useMultiSelectContext must be used within a MultiSelectContextProvider`,
    )
  }

  return context
}
