import { useEffect, useMemo } from 'react'

import { FormResponseMode } from '~shared/types'

import { usePreviewForm } from '~features/admin-form/common/queries'
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
import { useWorkspaceRowsContext } from '../WorkspaceFormRow/WorkspaceRowsContext'

export const useDupeFormWizardContext = (): CreateFormWizardContextReturn => {
  const { data: dashboardForms, isLoading: isWorkspaceLoading } = useWorkspace()
  const { activeFormMeta } = useWorkspaceRowsContext()
  const { data: previewFormData, isLoading: isPreviewFormLoading } =
    usePreviewForm(
      activeFormMeta?._id ?? '',
      // Stop querying once submissionData is present.
      /* enabled= */ !!activeFormMeta,
    )

  const containsMyInfoFields = useMemo(
    () => !!previewFormData?.form.form_fields.find((ff) => isMyInfo(ff)),
    [previewFormData?.form.form_fields],
  )

  const { formMethods, currentStep, direction, keypair, setCurrentStep } =
    useCommonFormWizardProvider()

  const { reset, getValues } = formMethods

  // Async set defaultValues onto modal inputs.
  useEffect(() => {
    if (
      isPreviewFormLoading ||
      isWorkspaceLoading ||
      !previewFormData ||
      !dashboardForms
    ) {
      return
    }

    reset({
      ...getValues(),
      responseMode: containsMyInfoFields
        ? FormResponseMode.Email
        : FormResponseMode.Encrypt,
      title: makeDuplicateFormTitle(previewFormData.form.title, dashboardForms),
    })
  }, [
    reset,
    getValues,
    previewFormData,
    isPreviewFormLoading,
    isWorkspaceLoading,
    dashboardForms,
    containsMyInfoFields,
  ])

  const { handleSubmit } = formMethods

  const { dupeEmailModeFormMutation, dupeStorageModeFormMutation } =
    useDuplicateFormMutations()

  const handleCreateStorageModeForm = handleSubmit(
    ({ title, responseMode }) => {
      if (responseMode !== FormResponseMode.Encrypt || !activeFormMeta?._id)
        return

      return dupeStorageModeFormMutation.mutate({
        formIdToDuplicate: activeFormMeta._id,
        title,
        responseMode,
        publicKey: keypair.publicKey,
      })
    },
  )

  const handleDetailsSubmit = handleSubmit((inputs) => {
    if (!activeFormMeta?._id) return
    if (inputs.responseMode === FormResponseMode.Email) {
      return dupeEmailModeFormMutation.mutate({
        formIdToDuplicate: activeFormMeta._id,
        emails: inputs.emails.filter(Boolean),
        title: inputs.title,
        responseMode: inputs.responseMode,
      })
    }
    setCurrentStep([CreateFormFlowStates.Landing, 1])
  })

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
    containsMyInfoFields,
    modalHeader: 'Duplicate form',
  }
}

export const DupeFormWizardProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const values = useDupeFormWizardContext()
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
