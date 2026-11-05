import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { FormResponseMode } from 'formsg-shared/types'

import { useFormTemplate } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
  CreateFormWizardInputProps,
} from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '~features/workspace/components/CreateFormModal/CreateFormWizardProvider'
import { buildFormClientMetadata } from '~features/workspace/utils/buildFormClientMetadata'

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
    isLegacySetup,
    proceedCtaLabel,
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
    useStorageModeFormTemplateMutation,
    useMultirespondentFormTemplateMutation,
  } = useUseTemplateMutations()

  const { user } = useUser()
  const adminEmail = user?.email

  const createFormFromTemplate = ({
    title,
    responseMode,
    emails,
    formOriginProcess,
    formOrigins,
  }: CreateFormWizardInputProps) => {
    if (!formId) return

    const metadata = buildFormClientMetadata({
      isPaperTrackingSetUpPageEnabled,
      isMrfCutoverEnabled,
      formOriginProcess,
      formOrigins,
      formResponseMode: responseMode,
    })

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
            ...(metadata && { metadata }),
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
            ...(metadata && { metadata }),
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

  return {
    isFetching: isTemplateFormLoading,
    isLoading:
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
    isLegacySetup,
    proceedCtaLabel,
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
