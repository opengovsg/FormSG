/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormResponseMode, PublicFormViewDto } from '~shared/types'

import formsgSdk from '~utils/formSdk'

import {
  useCreateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from './CreateFormWizardContext'

const INITIAL_STEP_STATE: [CreateFormFlowStates, -1 | 1 | 0] = [
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

  const { handleSubmit, setValue } = formMethods

  const {
    createEmailModeFormMutation,
    createStorageModeFormMutation,
    createMultirespondentModeFormMutation,
  } = useCreateFormMutations()

  const { emailModeFeedbackMutation } = useEmailModeFeedbackMutation()

  const { activeWorkspace, isDefaultWorkspace } = useWorkspaceContext()

  // do not mutate with workspaceId if it is 'All Forms' (default workspace)
  // as the default workspace contains an empty string as workspaceId
  const workspaceId = isDefaultWorkspace ? undefined : activeWorkspace._id

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode, emails }) => {
      switch (responseMode) {
        case FormResponseMode.Encrypt:
          return createStorageModeFormMutation.mutate({
            title,
            responseMode,
            publicKey: keypair.publicKey,
            workspaceId,
            emails: emails.filter(Boolean),
          })
        case FormResponseMode.Email:
          return
        case FormResponseMode.Multirespondent:
          return createMultirespondentModeFormMutation.mutate({
            title,
            responseMode,
            publicKey: keypair.publicKey,
            workspaceId,
          })
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = responseMode
          throw new Error('Invalid response mode')
        }
      }
    },
  )

  // TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
  // Collect email mode usage feedback before creating the form
  const handleEmailFeedbackSubmit = () => {
    // explicit set response to email as email feedback "button" interaction
    // is not handled handled in FormResponseOptions
    // setValue('responseMode', FormResponseMode.Email)
    setCurrentStep([CreateFormFlowStates.EmailFeedback, 1])
  }

  // TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
  const submitEmailModeFeedback = (feedbackForm: PublicFormViewDto) => {
    return handleSubmit((inputs) => {
      if (!inputs.reason) {
        return new Error('Reason is required')
      }

      emailModeFeedbackMutation.mutate(
        {
          body: { reason: inputs.reason },
          feedbackForm,
        },
        {
          onSuccess: () => {
            setValue('responseMode', FormResponseMode.Email)
            setCurrentStep([CreateFormFlowStates.EmailModeCreation, 1])
          },
        },
      )
    })
  }

  // TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
  const handleCreateEmailModeForm = () => {
    return handleSubmit((inputs) => {
      createEmailModeFormMutation.mutate({
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: FormResponseMode.Email,
        workspaceId,
      })
    })
  }

  const handleDetailsSubmit = handleSubmit(() => {
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

  return {
    isFetching: false,
    isLoading:
      createEmailModeFormMutation.isLoading ||
      createStorageModeFormMutation.isLoading ||
      createMultirespondentModeFormMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleCreateEmailModeForm,
    submitEmailModeFeedback,
    handleEmailFeedbackSubmit,
    handleCreateStorageModeOrMultirespondentForm,
    isSingpass: false,
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
