import { createContext, useContext } from 'react'
import {
  Strategy,
  UseFloatingReturn,
} from '@floating-ui/react-dom-interactions'

interface SelectPopoverContextReturn {
  floatingRef: UseFloatingReturn['floating']
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
