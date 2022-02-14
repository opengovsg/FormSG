// Contains all the shared props that will probably be passed down.
import { createContext, useContext } from 'react'

type VerifiedFieldsContextReturn = {
  transactionId?: string
}

export const VerifiedFieldsContext = createContext<
  VerifiedFieldsContextReturn | undefined
>(undefined)

export const useVerifiedFieldsContext = (): VerifiedFieldsContextReturn => {
  const context = useContext(VerifiedFieldsContext)
  if (!context) {
    throw new Error(
      `useVerifiedFieldsContext must be used within a VerifiedFieldsProvider component`,
    )
  }
  return context
}
