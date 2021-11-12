import { createContext, useContext, useState } from 'react'
import { useForm, UseFormHandleSubmit, UseFormReturn } from 'react-hook-form'

import { FormResponseMode } from '~shared/types/form/form'

import formsgSdk from '~utils/formSdk'

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
  handleCreateStorageModeForm: ReturnType<
    UseFormHandleSubmit<CreateFormWizardInputProps>
  >
  handleBackToDetails: () => void
  resetModal: () => void
  keypair: ReturnType<typeof formsgSdk.crypto.generate>
  isLoading: boolean
}

const CreateFormWizardContext = createContext<
  CreateFormWizardContextReturn | undefined
>(undefined)

type CreateFormWizardInputProps = {
  title: string
  responseMode: FormResponseMode
  // Email form
  emails: string[]
}

const INITIAL_STEP_STATE: [CreateFormFlowStates, number] = [
  CreateFormFlowStates.Details,
  0 | 1 | -1,
]

const useCreateFormWizardContext = (): CreateFormWizardContextReturn => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  /**
   * Only used for storage mode forms, but generated first so that the key is
   * immutable per open of the modal.
   */
  const [keypair, setKeypair] = useState(formsgSdk.crypto.generate())

  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues: {
      title: '',
      responseMode: FormResponseMode.Encrypt,
    },
  })

  const { handleSubmit, reset } = formMethods

  const { createEmailModeFormMutation, createStorageModeFormMutation } =
    useCreateFormMutations()

  const handleCreateStorageModeForm = handleSubmit(
    ({ title, responseMode }) => {
      if (responseMode !== FormResponseMode.Encrypt) return

      return createStorageModeFormMutation.mutate({
        title,
        responseMode,
        publicKey: keypair.publicKey,
      })
    },
  )

  const handleDetailsSubmit = handleSubmit((inputs) => {
    if (inputs.responseMode === FormResponseMode.Email) {
      return createEmailModeFormMutation.mutate({
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: inputs.responseMode,
      })
    }
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

  const handleBackToDetails = () => {
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }

  const resetModal = () => {
    reset()
    // Regenerate keypair for next open of modal.
    setKeypair(formsgSdk.crypto.generate())
    setCurrentStep(INITIAL_STEP_STATE)
  }

  return {
    isLoading:
      createEmailModeFormMutation.isLoading ||
      createStorageModeFormMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleCreateStorageModeForm,
    handleBackToDetails,
    resetModal,
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
