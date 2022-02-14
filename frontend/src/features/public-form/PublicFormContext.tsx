// Contains all the shared props that will probably be passed down.
import { createContext, RefObject, useContext, useRef } from 'react'

interface PublicFormContextProps {
  miniHeaderRef: RefObject<HTMLDivElement>
}

export const PublicFormContext = createContext<
  PublicFormContextProps | undefined
>(undefined)

export const usePublicFormContext = (): PublicFormContextProps => {
  const context = useContext(PublicFormContext)
  if (!context) {
    throw new Error(
      `usePublicFormContext must be used within a PublicFormProvider component`,
    )
  }
  return context
}
