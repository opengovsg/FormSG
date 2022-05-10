import { createContext, Dispatch, SetStateAction, useContext } from 'react'
import type { Instance as PopperInstance } from '@popperjs/core'

interface SelectPopoverContextReturn {
  popperRef: Dispatch<SetStateAction<HTMLDivElement | null>> | null
  popperStyles: { [key: string]: React.CSSProperties }
  popperAttributes: { [key: string]: { [key: string]: string } | undefined }
  update: PopperInstance['update'] | null
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
