// Contains all the shared props that will probably be passed down.
import { createContext, RefObject, useContext } from 'react'
import { UseQueryResult } from 'react-query'

import { PublicFormViewDto } from '~shared/types/form'
import { FieldResponse } from '~shared/types/response'

export type SubmissionData = {
  id: string | undefined
  submission: FieldResponse[]
  timeInEpochMs: number
}

export interface PublicFormContextProps
  extends Partial<PublicFormViewDto>,
    Omit<UseQueryResult<PublicFormViewDto>, 'data'> {
  miniHeaderRef: RefObject<HTMLDivElement>
  formId: string
  /**
   * @note async function due to possibility of calling API to generate transactionId.
   * Get current verification transaction ID for the form.
   */
  getTransactionId: () => Promise<string>
  /**
   * The expiry time of current transaction, if it exists.
   * Is `null` if no transaction has been generated yet. */
  expiryInMs: number | null
  /** Callback to be invoked when user submits public form. */
  handleSubmitForm: (formInputs: any) => void
  /** If form is submitted, submissionData will be defined. */
  submissionData?: SubmissionData
  /** Color of background based on form's colorTheme */
  formBgColor: string
  /** id of container to render captcha in  */
  captchaContainerId: string
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
