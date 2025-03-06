import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { FormResponseMode, PublicFormViewDto } from '~shared/types'

import { useFormTemplate } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
} from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '~features/workspace/components/CreateFormModal/CreateFormWizardProvider'
import { useEmailModeFeedbackMutation } from '~features/workspace/mutations'

import { useUseTemplateMutations } from '../mutation'

export const useUseTemplateWizardContext = (
  formId: string,
): CreateFormWizardContextReturn => {
  const { t } = useTranslation()
  const { data: templateFormData, isLoading: isTemplateFormLoading } =
    useFormTemplate(
      formId,
      // Stop querying if formId does not exist or if it's not in preview mode
      /* enabled= */ !!formId,
    )

  const isSingpass = !!templateFormData?.spcpSession

  const { formMethods, currentStep, direction, keypair, setCurrentStep } =
    useCommonFormWizardProvider()

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

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode }) => {
      if (!formId) return
      switch (responseMode) {
        case FormResponseMode.Encrypt: {
          return useStorageModeFormTemplateMutation.mutate({
            formIdToDuplicate: formId,
            title,
            responseMode,
            publicKey: keypair.publicKey,
            emails: [],
          })
        }
        case FormResponseMode.Multirespondent: {
          return useMultirespondentFormTemplateMutation.mutate({
            formIdToDuplicate: formId,
            title,
            responseMode,
            publicKey: keypair.publicKey,
          })
        }
        case FormResponseMode.Email: {
          return
        }
        default: {
          const _: never = responseMode
          throw new Error(`Unhandled response mode: ${_}`)
        }
      }
    },
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
        emails: inputs.emails.filter(Boolean),
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
    handleEmailFeedbackSubmit,
    handleCreateEmailModeForm,
    submitEmailModeFeedback,
    isSingpass,
    modalHeader: t('features.workspace.modals.create.title.duplicate'),
  }
}

interface UseTemplateWizardProviderProps {
  formId: string
  children: React.ReactNode
}

/**
 * Note: The word "Use" in "UseTemplateWizardProvider" is not referring to React's "use" convention for hooks.
 * "UseTemplate" is a FormSG functionality referring to the FormSG feature of utilising another form as a starting template.
 */
export const UseTemplateWizardProvider = ({
  formId,
  children,
}: UseTemplateWizardProviderProps): JSX.Element => {
  const values = useUseTemplateWizardContext(formId)
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
