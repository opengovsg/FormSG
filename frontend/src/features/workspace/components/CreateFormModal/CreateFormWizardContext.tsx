import { createContext, useContext, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'

import { FormResponseMode } from '~shared/types/form/form'

export enum CreateFormFlowStates {
  Landing = 'landing',
  Details = 'details',
}

type CreateFormWizardContextReturn = {
  currentStep: CreateFormFlowStates
  setCurrentStep: (step: CreateFormFlowStates) => void
  formMethods: UseFormReturn<CreateFormWizardInputProps>
}

const CreateFormWizardContext = createContext<
  CreateFormWizardContextReturn | undefined
>(undefined)

type BaseCreateFormWizardInputProps = {
  formName: string
  responseMode: FormResponseMode
}

interface CreateStorageFormWizardInputProps
  extends BaseCreateFormWizardInputProps {
  responseMode: FormResponseMode.Encrypt
  lostAck: boolean
}

type CreateEmailFormWizardInputProps = BaseCreateFormWizardInputProps

type CreateFormWizardInputProps =
  | CreateStorageFormWizardInputProps
  | CreateEmailFormWizardInputProps

const useCreateFormWizardContext = (): CreateFormWizardContextReturn => {
  const [currentStep, setCurrentStep] = useState(CreateFormFlowStates.Details)

  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues: {
      responseMode: FormResponseMode.Encrypt,
    },
  })

  return { currentStep, setCurrentStep, formMethods }
}

export const CreateFormWizardProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const values = useCreateFormWizardContext()
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}

export const useCreateFormWizard = (): CreateFormWizardContextReturn => {
  const context = useContext(CreateFormWizardContext)
  if (!context) {
    throw new Error(
      `useCreateFormWizard must be used within a CreateFormWizardProvider component`,
    )
  }
  return context
}
