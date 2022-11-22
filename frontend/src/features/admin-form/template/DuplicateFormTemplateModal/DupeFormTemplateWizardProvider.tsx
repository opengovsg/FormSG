import { useEffect, useMemo } from 'react'

import { FormResponseMode } from '~shared/types'

import { useFormTemplate } from '~features/admin-form/common/queries'
import { isMyInfo } from '~features/myinfo/utils'
import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
} from '~features/workspace/components/CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '~features/workspace/components/CreateFormModal/CreateFormWizardProvider'

import { useDuplicateFormTemplateMutations } from '../mutation'

export const useDupeFormTemplateWizardContext = (
  formId: string,
): CreateFormWizardContextReturn => {
  const { data: templateFormData, isLoading: isTemplateFormLoading } =
    useFormTemplate(
      formId,
      // Stop querying if formId does not exist or if it's not in preview mode
      /* enabled= */ !!formId,
    )

  const containsMyInfoFields = useMemo(
    () => !!templateFormData?.form.form_fields.find((ff) => isMyInfo(ff)),
    [templateFormData?.form.form_fields],
  )

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
      responseMode: containsMyInfoFields
        ? FormResponseMode.Email
        : FormResponseMode.Encrypt,
      title: `[Template] ${templateFormData?.form.title}`,
    })
  }, [
    reset,
    getValues,
    containsMyInfoFields,
    isTemplateFormLoading,
    templateFormData?.form.title,
  ])

  const { handleSubmit } = formMethods

  const {
    dupeEmailModeFormTemplateMutation,
    dupeStorageModeFormTemplateMutation,
  } = useDuplicateFormTemplateMutations()

  const handleCreateStorageModeForm = handleSubmit(
    ({ title, responseMode }) => {
      if (responseMode !== FormResponseMode.Encrypt || !formId) return

      return dupeStorageModeFormTemplateMutation.mutate({
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
      return dupeEmailModeFormTemplateMutation.mutate({
        formIdToDuplicate: formId,
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: inputs.responseMode,
      })
    }
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

  const handleBackToDetails = () => {
    setCurrentStep([CreateFormFlowStates.Details, -1])
  }

  return {
    isFetching: isTemplateFormLoading,
    isLoading:
      dupeEmailModeFormTemplateMutation.isLoading ||
      dupeStorageModeFormTemplateMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleCreateStorageModeForm,
    handleBackToDetails,
    containsMyInfoFields,
    modalHeader: 'Duplicate form',
  }
}

interface DupeFormTemplateWizardProviderProps {
  formId: string
  children: React.ReactNode
}

export const DupeFormTemplateWizardProvider = ({
  formId,
  children,
}: DupeFormTemplateWizardProviderProps): JSX.Element => {
  const values = useDupeFormTemplateWizardContext(formId)
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
