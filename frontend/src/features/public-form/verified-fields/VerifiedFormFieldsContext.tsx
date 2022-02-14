// Contains all the shared props that will probably be passed down.
import { createContext, useContext } from 'react'

type VerifiedFormFieldsContextReturn = {
  transactionId?: string
}

export const VerifiedFormFieldsContext = createContext<
  VerifiedFormFieldsContextReturn | undefined
>(undefined)

export const useVerifiedFormFields = (): VerifiedFormFieldsContextReturn => {
  const context = useContext(VerifiedFormFieldsContext)
  return context ?? {}
}
