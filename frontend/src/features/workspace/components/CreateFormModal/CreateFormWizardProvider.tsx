import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormResponseMode } from '~shared/types'

import formsgSdk from '~utils/formSdk'

import { useCreateFormMutations } from '~features/workspace/mutations'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from './CreateFormWizardContext'

export const INITIAL_STEP_STATE: [CreateFormFlowStates, -1 | 1 | 0] = [
  CreateFormFlowStates.Details,
  -1,
]

interface UseCommonFormWizardProviderProps {
  defaultValues?: Partial<CreateFormWizardInputProps>
}

export const useCommonFormWizardProvider = ({
  defaultValues,
}: UseCommonFormWizardProviderProps = {}) => {
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  /**
   * Only used for storage mode forms, but generated first so that the key is
   * immutable per open of the modal.
   */
  const keypair = useMemo(() => formsgSdk.crypto.generate(), [])

  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues,
  })

  return {
    formMethods,
    keypair,
    currentStep,
    direction,
    setCurrentStep,
  }
}

const useCreateFormWizardContext = (): CreateFormWizardContextReturn => {
  const { formMethods, currentStep, direction, keypair, setCurrentStep } =
    useCommonFormWizardProvider({
      defaultValues: {
        responseMode: FormResponseMode.Encrypt,
      },
    })

  const { handleSubmit } = formMethods

  const {
    createEmailModeFormMutation,
    createStorageModeOrMultirespondentFormMutation,
  } = useCreateFormMutations()

  const { activeWorkspace, isDefaultWorkspace } = useWorkspaceContext()

  // do not mutate with workspaceId if it is 'All Forms' (default workspace)
  // as the default workspace contains an empty string as workspaceId
  const workspaceId = isDefaultWorkspace ? undefined : activeWorkspace._id

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode }) => {
      if (
        !(
          responseMode === FormResponseMode.Encrypt ||
          responseMode === FormResponseMode.Multirespondent
        )
      ) {
        return
      }

      return createStorageModeOrMultirespondentFormMutation.mutate({
        title,
        responseMode,
        publicKey: keypair.publicKey,
        workspaceId,
      })
    },
  )

  const handleDetailsSubmit = handleSubmit((inputs) => {
    if (inputs.responseMode === FormResponseMode.Email) {
      return createEmailModeFormMutation.mutate({
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: inputs.responseMode,
        workspaceId,
      })
    }
    // Display secret key for all other form modes
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

  return {
    isFetching: false,
    isLoading:
      createEmailModeFormMutation.isLoading ||
      createStorageModeOrMultirespondentFormMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleCreateStorageModeOrMultirespondentForm,
    hasSingpass: false,
    modalHeader: 'Set up your form',
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
