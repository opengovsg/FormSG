/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, PublicFormViewDto } from 'formsg-shared/types'

import formsgSdk from '~utils/formSdk'

import { useUser } from '~features/user/queries'
import {
  useCreateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { mapWizardAnswersToFormMetadata } from '~features/workspace/utils/formMetadata'
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
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  const [[currentStep, direction], setCurrentStep] =
    useState(INITIAL_STEP_STATE)

  /**
   * Only used for storage mode forms, but generated first so that the key is
   * immutable per open of the modal.
   */
  const keypair = useMemo(() => formsgSdk.crypto.generate(), [])

  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues: {
      ...defaultValues,
      ...(isMrfCutoverEnabled
        ? { responseMode: FormResponseMode.Multirespondent }
        : {}),
    },
  })

  const { setValue } = formMethods

  // TODO [MRF-CUTOVER]: Remove after cutover. -1 is used temporarily as there is an existing animation bug with +1.
  const goToStorageModeDetails = () => {
    setValue('responseMode', FormResponseMode.Encrypt)
    setCurrentStep([CreateFormFlowStates.StorageModeDetails, -1])
  }
  const goToMrfDetails = () => {
    setValue('responseMode', FormResponseMode.Multirespondent)
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }
  // Advance from the title screen to the paper-form question (post-cutover).
  // handleSubmit gates the transition on title validation. Shared by the
  // Create, Duplicate, and Use-Template wizards.
  const goToPaperFormQuestion = formMethods.handleSubmit(() => {
    setCurrentStep([CreateFormFlowStates.PaperFormQuestion, 1])
  })

  return {
    formMethods,
    keypair,
    currentStep,
    direction,
    setCurrentStep,
    isMrfCutoverEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
    goToPaperFormQuestion,
  }
}

const useCreateFormWizardContext = (
  onClose: () => void,
): CreateFormWizardContextReturn => {
  const { t } = useTranslation()
  const {
    formMethods,
    currentStep,
    direction,
    keypair,
    setCurrentStep,
    isMrfCutoverEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
    goToPaperFormQuestion,
  } = useCommonFormWizardProvider({
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

  const { user } = useUser()
  const adminEmail = user?.email

  const { emailModeFeedbackMutation } = useEmailModeFeedbackMutation()

  const { activeWorkspace, isDefaultWorkspace } = useWorkspaceContext()

  // do not mutate with workspaceId if it is 'All Forms' (default workspace)
  // as the default workspace contains an empty string as workspaceId
  const workspaceId = isDefaultWorkspace ? undefined : activeWorkspace._id

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode, emails, isPaperForm }) => {
      const { formOrigin } = mapWizardAnswersToFormMetadata({
        isPaperForm: isPaperForm ?? 'no',
      })
      switch (responseMode) {
        case FormResponseMode.Encrypt: {
          const defaultEmails = adminEmail ? [adminEmail] : []
          return createStorageModeFormMutation.mutate(
            {
              title,
              responseMode,
              publicKey: keypair.publicKey,
              workspaceId,
              emails: (emails ?? defaultEmails).filter(Boolean),
              formOrigin,
            },
            {
              onSuccess: () => {
                setCurrentStep([CreateFormFlowStates.Landing, 1])
              },
            },
          )
        }
        case FormResponseMode.Email:
          return
        case FormResponseMode.Multirespondent:
          return createMultirespondentModeFormMutation.mutate(
            {
              title,
              responseMode,
              publicKey: keypair.publicKey,
              workspaceId,
              formOrigin,
            },
            {
              onSuccess: () => {
                setCurrentStep([CreateFormFlowStates.Landing, 1])
              },
            },
          )
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = responseMode
          throw new Error(
            t(
              'features.workspace.modals.forms.create.errors.responseMode.invalid',
            ),
          )
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
          body: { reason: inputs.reason, adminEmail },
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
        emails: (inputs.emails ?? []).filter(Boolean),
        title: inputs.title,
        responseMode: FormResponseMode.Email,
        workspaceId,
      })
    })
  }

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
    handleCreateEmailModeForm,
    submitEmailModeFeedback,
    handleEmailFeedbackSubmit,
    handleCreateStorageModeOrMultirespondentForm,
    isSingpass: false,
    hasMyInfoChildren: false,
    modalHeader: t('features.workspace.modals.forms.create.title.setup'),
    onClose,
    isMrfCutoverEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
    goToPaperFormQuestion,
  }
}

export const CreateFormWizardProvider = ({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}): JSX.Element => {
  const values = useCreateFormWizardContext(onClose)
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
