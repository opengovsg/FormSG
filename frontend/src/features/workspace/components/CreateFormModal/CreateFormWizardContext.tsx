import { createContext, useContext, useState } from 'react'
import { useForm, UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'

import { FormResponseMode } from '~shared/types/form/form'

import { useCreateFormMutations } from '~features/workspace/mutations'

export enum CreateFormFlowStates {
  Landing = 'landing',
  Details = 'details',
}

type CreateFormWizardContextReturn = {
  currentStep: CreateFormFlowStates
  direction: number
  formMethods: UseFormReturn<CreateFormWizardInputProps>
  handleDetailsSubmit: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  handleBackToDetails: () => void
}

const CreateFormWizardContext = createContext<
  CreateFormWizardContextReturn | undefined
>(undefined)

type CreateFormWizardInputProps = {
  title: string
  responseMode: FormResponseMode
  // Encrypt form
  lostAck: boolean
  // Email form
  emails: string[]
}

const useCreateFormWizardContext = (): CreateFormWizardContextReturn => {
  const [[currentStep, direction], setCurrentStep] = useState([
    CreateFormFlowStates.Details,
    0,
  ])

  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues: {
      title: '',
      responseMode: FormResponseMode.Encrypt,
      lostAck: undefined,
    },
  })

  const { handleSubmit } = formMethods

  const { createEmailModeFormMutation } = useCreateFormMutations()

  const handleDetailsSubmit = handleSubmit(async (inputs) => {
    if (inputs.responseMode === FormResponseMode.Email) {
      return createEmailModeFormMutation.mutateAsync({
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: inputs.responseMode,
      })
    }
    console.log(inputs)
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

  const handleBackToDetails = () => {
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }

  return {
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleBackToDetails,
  }
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
