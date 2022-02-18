// Contains all the shared props that will probably be passed down.
import { createContext, RefObject, useContext } from 'react'
import { UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types/form'

interface PublicFormContextProps
  extends Partial<PublicFormViewDto>,
    Omit<UseQueryResult<PublicFormViewDto>, 'data'> {
  miniHeaderRef: RefObject<HTMLDivElement>
  formId: string
  /**
   * @note async function due to possibility of calling API to generate transactionId.
   * Get current verification transaction ID for the form.
   */
  getTransactionId: () => Promise<string>
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
