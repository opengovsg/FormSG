import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import { FormResponseMode, PublicFormViewDto } from 'formsg-shared/types'

import { useFormTemplate } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '~features/workspace/components/CreateFormModal/CreateFormWizardProvider'
import { useEmailModeFeedbackMutation } from '~features/workspace/mutations'

import { useUseTemplateMutations } from '../mutation'

export const useUseTemplateWizardContext = (
  formId: string,
  onClose: () => void,
): CreateFormWizardContextReturn => {
  const { t } = useTranslation()
  const { data: templateFormData, isLoading: isTemplateFormLoading } =
    useFormTemplate(
      formId,
      // Stop querying if formId does not exist or if it's not in preview mode
      /* enabled= */ !!formId,
    )

  const isSingpass = !!templateFormData?.spcpSession
  const hasMyInfoChildren = !!templateFormData?.form.form_fields.some(
    (field) => field.fieldType === 'children',
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
    goToFormDetails,
    makeHandleProceedFromDetails,
  } = useCommonFormWizardProvider()

  const { reset, getValues } = formMethods

  // Async set defaultValues onto modal inputs.
  useEffect(() => {
    if (isTemplateFormLoading) {
      return
    }

    reset({
      ...getValues(),
      title: `[Template] ${templateFormData?.form.title}`,
    })
  }, [reset, getValues, isTemplateFormLoading, templateFormData?.form.title])

  const { handleSubmit, setValue } = formMethods

  const {
    useEmailModeFormTemplateMutation,
    useStorageModeFormTemplateMutation,
    useMultirespondentFormTemplateMutation,
  } = useUseTemplateMutations()

  const { user } = useUser()
  const adminEmail = user?.email

  const { emailModeFeedbackMutation } = useEmailModeFeedbackMutation()

  const createFormFromTemplate = ({
    title,
    responseMode,
    emails,
    formOrigins,
  }: CreateFormWizardInputProps) => {
    if (!formId) return

    // Paper-forms tracking: the use-template flow re-asks the origin question,
    // so the captured origins are written to the new form's metadata.
    // Submit-boundary guard: omit metadata when disabled or empty; carry
    // `othersInput` only when the "Other" sentinel is present with non-empty
    // trimmed text.
    const formOriginsMetadata =
      isPaperTrackingSetUpPageEnabled && formOrigins?.value.length
        ? {
            metadata: {
              formOrigins: {
                value: formOrigins.value,
                ...(formOrigins.value.includes(
                  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
                ) && formOrigins.othersInput?.trim()
                  ? { othersInput: formOrigins.othersInput.trim() }
                  : {}),
              },
            },
          }
        : {}

    switch (responseMode) {
      case FormResponseMode.Encrypt: {
        const defaultEmails = adminEmail ? [adminEmail] : []
        return useStorageModeFormTemplateMutation.mutate(
          {
            formIdToDuplicate: formId,
            title,
            responseMode,
            publicKey: keypair.publicKey,
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
      case FormResponseMode.Multirespondent: {
        return useMultirespondentFormTemplateMutation.mutate(
          {
            formIdToDuplicate: formId,
            title,
            responseMode,
            publicKey: keypair.publicKey,
            ...formOriginsMetadata,
          },
          {
            onSuccess: () => {
              setCurrentStep([CreateFormFlowStates.Landing, 1])
            },
          },
        )
      }
      case FormResponseMode.Email: {
        return
      }
      default: {
        const _: never = responseMode
        throw new Error(`Unhandled response mode: ${_}`)
      }
    }
  }

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    createFormFromTemplate,
  )

  const handleProceedFromDetails = makeHandleProceedFromDetails(
    createFormFromTemplate,
  )

  // TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented.
  // Collect email mode usage feedback before creating the form
  const handleEmailFeedbackSubmit = () => {
    // explicit set response to email as email feedback "button" interaction
    // is not handled handled in FormResponseOptions
    // setValue('responseMode', FormResponseMode.Email) // set in handleEmailModeCreation
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
      return useEmailModeFormTemplateMutation.mutate({
        formIdToDuplicate: formId,
        emails: (inputs.emails ?? []).filter(Boolean),
        title: inputs.title,
        responseMode: FormResponseMode.Email,
      })
    })

  return {
    isFetching: isTemplateFormLoading,
    isLoading:
      useEmailModeFormTemplateMutation.isLoading ||
      useStorageModeFormTemplateMutation.isLoading ||
      useMultirespondentFormTemplateMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleCreateStorageModeOrMultirespondentForm,
    handleProceedFromDetails,
    goToFormDetails,
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

interface UseTemplateWizardProviderProps {
  formId: string
  children: React.ReactNode
  onClose: () => void
}

/**
 * Note: The word "Use" in "UseTemplateWizardProvider" is not referring to React's "use" convention for hooks.
 * "UseTemplate" is a FormSG functionality referring to the FormSG feature of utilising another form as a starting template.
 */
export const UseTemplateWizardProvider = ({
  formId,
  children,
  onClose,
}: UseTemplateWizardProviderProps): JSX.Element => {
  const values = useUseTemplateWizardContext(formId, onClose)
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
