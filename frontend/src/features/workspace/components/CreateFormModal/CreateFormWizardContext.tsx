import { createContext, useContext } from 'react'
import { UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'

import { FormResponseMode } from '~shared/types/form/form'

import formsgSdk from '~utils/formSdk'

export enum CreateFormFlowStates {
  Landing = 'landing',
  Details = 'details',
}

export type CreateFormWizardInputProps = {
  title: string
  responseMode: FormResponseMode
  // Email form props
  emails: string[]
  // Storage form props
  storageAck?: boolean
}

export type CreateFormWizardContextReturn = {
  currentStep: CreateFormFlowStates
  direction: number
  formMethods: UseFormReturn<CreateFormWizardInputProps>
  handleDetailsSubmit: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  handleCreateStorageModeForm: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  keypair: ReturnType<typeof formsgSdk.crypto.generate>
  // Whether any async operation is in progress.
  isFetching: boolean
  isLoading: boolean
  modalHeader: string
  containsMyInfoFields: boolean
}

export const CreateFormWizardContext = createContext<
  CreateFormWizardContextReturn | undefined
>(undefined)

export const useCreateFormWizard = (): CreateFormWizardContextReturn => {
  const context = useContext(CreateFormWizardContext)
  if (!context) {
    throw new Error(
      `useCreateFormWizard must be used within a CreateFormWizardProvider component`,
    )
  }
  return context
}
