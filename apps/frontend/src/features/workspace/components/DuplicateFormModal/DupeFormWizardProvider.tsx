import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormResponseMode, PublicFormViewDto } from 'formsg-shared/types'
import { FormId } from 'formsg-shared/types/form/form'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  useDuplicateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
import { useDashboard } from '~features/workspace/queries'
import { makeDuplicateFormTitle } from '~features/workspace/utils/createDuplicateFormTitle'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '../CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '../CreateFormModal/CreateFormWizardProvider'

interface DupeFormWizardSource {
  formIdToDuplicate: FormId | undefined
  workspaceId?: string
}

export const useDupeFormWizardContext = (
  onClose: () => void,
  source: DupeFormWizardSource,
): CreateFormWizardContextReturn => {
  const { t } = useTranslation()
  const { data: dashboardForms, isLoading: isWorkspaceLoading } = useDashboard()
  const sourceFormId = source.formIdToDuplicate
  const { data: previewFormData, isLoading: isPreviewFormLoading } =
    usePreviewForm(
      sourceFormId ?? '',
      // Stop querying once submissionData is present.
      /* enabled= */ !!sourceFormId,
    )

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
  } = useCommonFormWizardProvider()

  const { reset, getValues } = formMethods

  const isSingpass = !!previewFormData?.spcpSession
  const hasMyInfoChildren = !!previewFormData?.form.form_fields.some(
    (field) => field.fieldType === 'children',
  )

  // Async set defaultValues onto modal inputs.
  useEffect(() => {
    if (
      isPreviewFormLoading ||
      isWorkspaceLoading ||
      !previewFormData ||
      !dashboardForms ||
      currentStep !== CreateFormFlowStates.Details
    ) {
      return
    }

    reset({
      ...getValues(),
      title: makeDuplicateFormTitle(previewFormData.form.title, dashboardForms),
    })
  }, [
    reset,
    getValues,
    previewFormData,
    isPreviewFormLoading,
    isWorkspaceLoading,
    dashboardForms,
    currentStep,
  ])

  const { handleSubmit, setValue } = formMethods

  const {
    dupeEmailModeFormMutation,
    dupeStorageModeFormMutation,
    dupeMultirespondentModeFormMutation,
  } = useDuplicateFormMutations()

  const { user } = useUser()
  const adminEmail = user?.email

  const { emailModeFeedbackMutation } = useEmailModeFeedbackMutation()

  const workspaceId = source.workspaceId

  const createDuplicateForm = ({
    title,
    responseMode,
    emails,
    formOrigins,
    formOriginOtherDetail,
  }: CreateFormWizardInputProps) => {
    if (!sourceFormId) {
      return
    }

    // Paper-forms tracking: the duplicate flow re-asks the origin question
    // (origins are never copied from the source form), so the freshly captured
    // origins are written to the new form's metadata. Same checkbox shape as
    // the create flow: selected codes (incl. the "Other" sentinel) in `value`,
    // the typed "Other" text in `othersInput`.
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
        return dupeStorageModeFormMutation.mutate(
          {
            formIdToDuplicate: sourceFormId,
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
        return dupeMultirespondentModeFormMutation.mutate(
          {
            formIdToDuplicate: sourceFormId,
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
        throw new Error('Invalid response mode')
      }
    }
  }

  const handleCreateStorageModeOrMultirespondentForm =
    handleSubmit(createDuplicateForm)

  // Paper-forms tracking: from the Details step, divert to the origin step when
  // enabled; otherwise duplicate directly (unchanged behaviour). Title validation
  // runs first via handleSubmit; the origin field is only registered on the
  // origin step, so it is not validated here.
  const handleProceedFromDetails = handleSubmit((inputs) => {
    if (isPaperTrackingSetUpPageEnabled) {
      return setCurrentStep([CreateFormFlowStates.Origin, 1])
    }
    return createDuplicateForm(inputs)
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
  const handleCreateEmailModeForm = () =>
    handleSubmit((inputs) => {
      if (!sourceFormId) return

      return dupeEmailModeFormMutation.mutate({
        formIdToDuplicate: sourceFormId,
        emails: (inputs.emails ?? []).filter(Boolean),
        title: inputs.title,
        responseMode: FormResponseMode.Email,
        workspaceId,
      })
    })

  return {
    isFetching: isWorkspaceLoading || isPreviewFormLoading,
    isLoading:
      dupeEmailModeFormMutation.isLoading ||
      dupeStorageModeFormMutation.isLoading ||
      dupeMultirespondentModeFormMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleCreateStorageModeOrMultirespondentForm,
    handleProceedFromDetails,
    goBackToDetails,
    isPaperTrackingSetUpPageEnabled,
    handleEmailFeedbackSubmit,
    handleCreateEmailModeForm,
    submitEmailModeFeedback,
    isSingpass,
    hasMyInfoChildren,
    modalHeader: t('features.workspace.modals.forms.create.title.duplicate'),
    onClose,
    isMrfCutoverEnabled,
    goToStorageModeDetails,
    goToMrfDetails,
  }
}

export const DupeFormWizardProvider = ({
  children,
  onClose,
  formIdToDuplicate,
  workspaceId,
}: {
  children: React.ReactNode
  onClose: () => void
  formIdToDuplicate: FormId | undefined
  workspaceId?: string
}): JSX.Element => {
  const values = useDupeFormWizardContext(onClose, {
    formIdToDuplicate,
    workspaceId,
  })
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
