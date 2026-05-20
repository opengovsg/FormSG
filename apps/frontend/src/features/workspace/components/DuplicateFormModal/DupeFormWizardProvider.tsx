import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

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
    goToStorageModeDetails,
    goToMrfDetails,
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

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode, emails }) => {
      if (!sourceFormId) {
        return
      }

      switch (responseMode) {
        case FormResponseMode.Encrypt: {
          const cutoverDefaultEmails = adminEmail ? [adminEmail] : []
          return dupeStorageModeFormMutation.mutate(
            {
              formIdToDuplicate: sourceFormId,
              title,
              responseMode,
              publicKey: keypair.publicKey,
              workspaceId,
              emails: emails ? emails.filter(Boolean) : cutoverDefaultEmails,
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
  const handleCreateEmailModeForm = () =>
    handleSubmit((inputs) => {
      if (!sourceFormId) return

      return dupeEmailModeFormMutation.mutate({
        formIdToDuplicate: sourceFormId,
        emails: inputs.emails.filter(Boolean),
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
