import { useEffect } from 'react'

import { FormResponseMode } from '~shared/types'

import { useFormTemplate } from '~features/admin-form/common/queries'
import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
} from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '~features/workspace/components/CreateFormModal/CreateFormWizardProvider'

import { useUseTemplateMutations } from '../mutation'

export const useUseTemplateWizardContext = (
  formId: string,
): CreateFormWizardContextReturn => {
  const { data: templateFormData, isLoading: isTemplateFormLoading } =
    useFormTemplate(
      formId,
      // Stop querying if formId does not exist or if it's not in preview mode
      /* enabled= */ !!formId,
    )

  const hasSingpass = !!templateFormData?.spcpSession

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

  const { handleSubmit } = formMethods

  const {
    useEmailModeFormTemplateMutation,
    useStorageModeOrMultirespondentFormTemplateMutation,
  } = useUseTemplateMutations()

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode }) => {
      if (
        !(
          responseMode === FormResponseMode.Encrypt ||
          responseMode === FormResponseMode.Multirespondent
        ) ||
        !formId
      ) {
        return
      }

      return useStorageModeOrMultirespondentFormTemplateMutation.mutate({
        formIdToDuplicate: formId,
        title,
        responseMode,
        publicKey: keypair.publicKey,
      })
    },
  )

  const handleDetailsSubmit = handleSubmit((inputs) => {
    if (!formId) return
    if (inputs.responseMode === FormResponseMode.Email) {
      return useEmailModeFormTemplateMutation.mutate({
        formIdToDuplicate: formId,
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: inputs.responseMode,
      })
    }
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

  return {
    isFetching: isTemplateFormLoading,
    isLoading:
      useEmailModeFormTemplateMutation.isLoading ||
      useStorageModeOrMultirespondentFormTemplateMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleCreateStorageModeOrMultirespondentForm,
    hasSingpass,
    modalHeader: 'Duplicate form',
  }
}

interface UseTemplateWizardProviderProps {
  formId: string
  children: React.ReactNode
}

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
