// Contains all the shared props that will probably be passed down.
import { createContext, RefObject, useContext } from 'react'
import { UseQueryResult } from 'react-query'

import { FormFieldDto } from '~shared/types'
import { PublicFormViewDto } from '~shared/types/form'

export type SidebarSectionMeta = Pick<FormFieldDto, 'title' | '_id'>

export type SubmissionData = {
  /** Submission id */
  id: string | undefined
  /** Submission time (on browser)  */
  timeInEpochMs: number
}
export interface PublicFormContextProps
  extends Partial<PublicFormViewDto>,
    Omit<UseQueryResult<PublicFormViewDto>, 'data'> {
  miniHeaderRef: RefObject<HTMLDivElement>
  formId: string
  /** Scroll data to allow form-fillers to scroll to a particular section. */
  sectionScrollData: SidebarSectionMeta[]
  /** Whether form authentication is required. */
  isAuthRequired: boolean
  /**
   * @note async function due to possibility of calling API to generate transactionId.
   * Get current verification transaction ID for the form.
   */
  getTransactionId: () => Promise<string>
  /**
   * The expiry time of current transaction, if it exists.
   * Is `null` if no transaction has been generated yet. */
  expiryInMs: number | null
  /** If form is submitted, submissionData will be defined. */
  submissionData?: SubmissionData
  /** Callback to be invoked when user submits public form. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSubmitForm: (formInputs: any) => void
  /** id of container to render captcha in.
   * Captcha will be instantiated if provided
   */
  captchaContainerId?: string
  captchaContainerId: string
  isMobileSectionSidebarOpen?: boolean
  handleMobileSectionSidebarClick?: () => void
  handleMobileSectionSidebarClose: () => void
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
