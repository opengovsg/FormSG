import { useEffect, useMemo } from 'react'

import { FormResponseMode } from '~shared/types'

import {
  useFormTemplate,
  usePreviewForm,
} from '~features/admin-form/common/queries'
import { isMyInfo } from '~features/myinfo/utils'
import { useDuplicateFormMutations } from '~features/workspace/mutations'
import { useWorkspace } from '~features/workspace/queries'
import { makeDuplicateFormTitle } from '~features/workspace/utils/createDuplicateFormTitle'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
} from '../CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '../CreateFormModal/CreateFormWizardProvider'

export const useDupeFormWizardContext = (
  formId: string,
  isTemplate: boolean,
): CreateFormWizardContextReturn => {
  const { data: dashboardForms, isLoading: isWorkspaceLoading } = useWorkspace()

  const { data: previewFormData, isLoading: isPreviewFormLoading } =
    usePreviewForm(
      formId,
      // Stop querying if formId does not exist or if it's in view template mode
      /* enabled= */ !!formId || !isTemplate,
    )

  const { data: templateFormData, isLoading: isTemplateFormLoading } =
    useFormTemplate(
      formId,
      // Stop querying if formId does not exist or if it's not in preview mode
      /* enabled= */ !!formId || isTemplate,
    )

  const data = templateFormData || previewFormData
  const isLoading = isTemplateFormLoading || isPreviewFormLoading

  const containsMyInfoFields = useMemo(
    () => !!data?.form.form_fields.find((ff) => isMyInfo(ff)),
    [data?.form.form_fields],
  )

  const { formMethods, currentStep, direction, keypair, setCurrentStep } =
    useCommonFormWizardProvider()

  const { reset, getValues } = formMethods

  // Async set defaultValues onto modal inputs.
  useEffect(() => {
    if (isLoading || isWorkspaceLoading || !data?.form || !dashboardForms) {
      return
    }

    reset({
      ...getValues(),
      responseMode: containsMyInfoFields
        ? FormResponseMode.Email
        : FormResponseMode.Encrypt,
      title: makeDuplicateFormTitle(
        isTemplate ? `Template_${data?.form.title}` : data?.form.title,
        dashboardForms,
      ),
    })
  }, [
    reset,
    getValues,
    data,
    isLoading,
    isWorkspaceLoading,
    dashboardForms,
    containsMyInfoFields,
    isTemplate,
  ])

  const { handleSubmit } = formMethods

  const { dupeEmailModeFormMutation, dupeStorageModeFormMutation } =
    useDuplicateFormMutations()

  const handleCreateStorageModeForm = handleSubmit(
    ({ title, responseMode }) => {
      if (responseMode !== FormResponseMode.Encrypt || !formId) return

      return dupeStorageModeFormMutation.mutate({
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
      return dupeEmailModeFormMutation.mutate({
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
    isFetching: isWorkspaceLoading || isPreviewFormLoading,
    isLoading:
      dupeEmailModeFormMutation.isLoading ||
      dupeStorageModeFormMutation.isLoading,
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

interface DupeFormWizardProviderProps {
  formId: string
  isTemplate?: boolean
  children: React.ReactNode
}

export const DupeFormWizardProvider = ({
  formId,
  isTemplate,
  children,
}: DupeFormWizardProviderProps): JSX.Element => {
  const values = useDupeFormWizardContext(formId, !!isTemplate)
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
