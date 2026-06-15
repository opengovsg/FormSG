/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import {
  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  featureFlags,
} from 'formsg-shared/constants'
import { FormResponseMode, PublicFormViewDto } from 'formsg-shared/types'

import formsgSdk from '~utils/formSdk'

import { useUser } from '~features/user/queries'
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
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  const isPaperTrackingSetUpPageEnabled = useFeatureIsOn(
    featureFlags.enablePaperTrackingSetUpPage,
  )
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
  // Paper-forms tracking: return from the origin step to the title step. The
  // entered title (and any selected origins) persist in formMethods.
  const goBackToDetails = () => {
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }

  return {
    formMethods,
    keypair,
    currentStep,
    direction,
    setCurrentStep,
    isMrfCutoverEnabled,
    isPaperTrackingSetUpPageEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
    goBackToDetails,
  }
}

export const useCreateFormWizardContext = (
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
    isPaperTrackingSetUpPageEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
    goBackToDetails,
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

  const createStorageModeOrMultirespondentForm = ({
    title,
    responseMode,
    emails,
    formOrigins,
    formOriginOtherDetail,
  }: CreateFormWizardInputProps) => {
    // Paper-forms tracking: carry the captured origins so the form is created
    // with them in a single write. Only attached when the origin step is enabled
    // and the admin selected at least one. Mapped to the backend's checkbox shape
    // (CheckboxFieldResponsesV3): the selected codes (incl. the "Other" sentinel)
    // go in `value`, and the typed "Other" text in `othersInput`. Shared by the
    // storage and multirespondent branches since both flow through the origin
    // step once `enablePaperTrackingSetUpPage` is on.
    const formOriginsMetadata =
      isPaperTrackingSetUpPageEnabled && formOrigins?.length
        ? {
            metadata: {
              formOrigins: {
                value: formOrigins,
                ...(formOrigins.includes(CLIENT_CHECKBOX_OTHERS_INPUT_VALUE) &&
                formOriginOtherDetail?.trim()
                  ? { othersInput: formOriginOtherDetail.trim() }
                  : {}),
              },
            },
          }
        : {}

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
            ...formOriginsMetadata,
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
            ...formOriginsMetadata,
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
  }

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    createStorageModeOrMultirespondentForm,
  )

  // Paper-forms tracking: from the Details (title) step, divert to the origin
  // step whenever `enablePaperTrackingSetUpPage` is on; otherwise create the form
  // directly (unchanged behaviour). Decoupled from the MRF cutover so the origin
  // page can be piloted (by email domain) before cutover completes — it applies
  // to both storage and multirespondent creates. Email mode is no longer a
  // reachable create option, so it needs no special-casing here. Title validation
  // runs first via handleSubmit; the origin field is only registered on the
  // origin step, so it is not validated here.
  const handleProceedFromDetails = handleSubmit((inputs) => {
    if (isPaperTrackingSetUpPageEnabled) {
      return setCurrentStep([CreateFormFlowStates.Origin, 1])
    }
    return createStorageModeOrMultirespondentForm(inputs)
  })

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
    handleProceedFromDetails,
    goBackToDetails,
    isPaperTrackingSetUpPageEnabled,
    isSingpass: false,
    hasMyInfoChildren: false,
    modalHeader: t('features.workspace.modals.forms.create.title.setup'),
    onClose,
    isMrfCutoverEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
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
