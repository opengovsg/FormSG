/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, PublicFormViewDto } from 'formsg-shared/types'

import { sendDdFormCreationSelectionAction } from '~utils/datadog'
import formsgSdk from '~utils/formSdk'

import { useUser } from '~features/user/queries'
import {
  useCreateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { buildFormClientMetadata } from '~features/workspace/utils/buildFormClientMetadata'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from './CreateFormWizardContext'

interface UseCommonFormWizardProviderProps {
  defaultValues?: Partial<CreateFormWizardInputProps>
  /**
   * Step the wizard opens on. Defaults to the form details screen; pass
   * `StorageModeDetails` to drop the admin straight into the legacy setup.
   */
  initialStep?: CreateFormFlowStates
}

export const useCommonFormWizardProvider = ({
  defaultValues,
  initialStep = CreateFormFlowStates.Details,
}: UseCommonFormWizardProviderProps = {}) => {
  const { t } = useTranslation()
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  const isPaperTrackingSetUpPageEnabled = useFeatureIsOn(
    featureFlags.enablePaperTrackingSetUpPage,
  )
  const proceedCtaLabel = isPaperTrackingSetUpPageEnabled
    ? t('features.workspace.modals.forms.create.details.next')
    : t('features.workspace.modals.forms.create.details.create')
  const startsInStorageMode =
    initialStep === CreateFormFlowStates.StorageModeDetails
  const [[currentStep, direction], setCurrentStep] = useState<
    [CreateFormFlowStates, -1 | 1 | 0]
  >([initialStep, -1])
  // TODO [MRF-CUTOVER]: Remove after cutover escape hatch is no longer needed.
  const [isLegacySetup, setIsLegacySetup] = useState(startsInStorageMode)

  /**
   * Only used for storage mode forms, but generated first so that the key is
   * immutable per open of the modal.
   */
  const keypair = useMemo(() => formsgSdk.crypto.generate(), [])

  const formMethods = useForm<CreateFormWizardInputProps>({
    defaultValues: {
      ...defaultValues,
      // Opening straight into the legacy setup means a storage mode form, so
      // seed the response mode that screen expects (mirrors goToStorageModeDetails).
      ...(startsInStorageMode
        ? { responseMode: FormResponseMode.Encrypt }
        : isMrfCutoverEnabled
          ? { responseMode: FormResponseMode.Multirespondent }
          : {}),
    },
  })

  const { setValue } = formMethods

  // TODO [MRF-CUTOVER]: Remove after cutover. -1 is used temporarily as there is an existing animation bug with +1.
  const goToStorageModeDetails = () => {
    setValue('responseMode', FormResponseMode.Encrypt)
    setIsLegacySetup(true)
    setCurrentStep([CreateFormFlowStates.StorageModeDetails, -1])
  }
  const goToMrfDetails = () => {
    setValue('responseMode', FormResponseMode.Multirespondent)
    setIsLegacySetup(false)
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }
  const goToFormDetails = () => {
    setIsLegacySetup(false)
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }

  const makeHandleProceedFromDetails = (
    createForm: (inputs: CreateFormWizardInputProps) => unknown,
    onValidProceed?: (inputs: CreateFormWizardInputProps) => void,
  ) =>
    formMethods.handleSubmit((inputs) => {
      onValidProceed?.(inputs)
      if (isPaperTrackingSetUpPageEnabled) {
        return setCurrentStep([CreateFormFlowStates.Origin, 1])
      }
      return createForm(inputs)
    })

  return {
    formMethods,
    keypair,
    currentStep,
    direction,
    setCurrentStep,
    isMrfCutoverEnabled,
    isPaperTrackingSetUpPageEnabled,
    isLegacySetup,
    proceedCtaLabel,
    goToStorageModeDetails,
    goToMrfDetails,
    goToFormDetails,
    makeHandleProceedFromDetails,
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
    isLegacySetup,
    proceedCtaLabel,
    goToStorageModeDetails,
    goToMrfDetails,
    goToFormDetails,
    makeHandleProceedFromDetails,
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
  }: CreateFormWizardInputProps) => {
    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled,
      isMrfCutoverEnabled,
      formOrigins,
      formResponseMode: responseMode,
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
            ...(metadata && { metadata }),
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
            ...(metadata && { metadata }),
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

  // Time spent on the selection (details) screen, restarted on every entry so
  // returning from the MRF escape hatch does not inflate the measurement.
  const detailsScreenStartMs = useRef<number | null>(null)
  useEffect(() => {
    if (currentStep === CreateFormFlowStates.Details) {
      detailsScreenStartMs.current = performance.now()
    }
  }, [currentStep])

  const handleProceedFromDetails = makeHandleProceedFromDetails(
    createStorageModeOrMultirespondentForm,
    ({ responseMode }) => {
      if (detailsScreenStartMs.current === null) return
      void sendDdFormCreationSelectionAction(
        responseMode,
        performance.now() - detailsScreenStartMs.current,
      )
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
    handleProceedFromDetails,
    goToFormDetails,
    isPaperTrackingSetUpPageEnabled,
    isLegacySetup,
    proceedCtaLabel,
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
