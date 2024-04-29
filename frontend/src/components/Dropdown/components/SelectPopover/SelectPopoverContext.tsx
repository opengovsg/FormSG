import { createContext, useContext } from 'react'
import { type Strategy, type UseFloatingReturn } from '@floating-ui/react'

interface SelectPopoverContextReturn {
  floatingRef: UseFloatingReturn['refs']['setFloating']
  floatingStyles: {
    position: Strategy
    top: number
    left: number
  }
}

export const SelectPopoverContext = createContext<
  SelectPopoverContextReturn | undefined
>(undefined)

export const useSelectPopover = () => {
  const context = useContext(SelectPopoverContext)

  if (context === undefined) {
    throw new Error(
      `useSelectPopoverContext must be used within a SelectPopoverContextProvider`,
    )
  }

  return context
}
