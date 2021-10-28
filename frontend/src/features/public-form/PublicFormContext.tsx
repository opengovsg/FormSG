// Contains all the shared props that will probably be passed down.
import { createContext, RefObject, useContext, useRef } from 'react'

interface PublicFormContextProps {
  miniHeaderRef: RefObject<HTMLDivElement>
}

const PublicFormContext = createContext<PublicFormContextProps | undefined>(
  undefined,
)

export const PublicFormProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const miniHeaderRef = useRef<HTMLDivElement>(null)

  return (
    <PublicFormContext.Provider value={{ miniHeaderRef }}>
      {children}
    </PublicFormContext.Provider>
  )
}

export const usePublicFormContext = (): PublicFormContextProps => {
  const context = useContext(PublicFormContext)
  if (!context) {
    throw new Error(
      `usePublicFormContext must be used within a PublicFormProvider component`,
    )
  }
  return context
}
