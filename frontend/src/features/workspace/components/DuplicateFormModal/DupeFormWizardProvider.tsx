import { useEffect } from 'react'

import { FormResponseMode } from '~shared/types'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useCreateFormMutations } from '~features/workspace/mutations'
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

  const { formMethods, currentStep, direction, keypair, setCurrentStep } =
    useCommonFormWizardProvider({
      defaultValues: {
        responseMode: FormResponseMode.Encrypt,
      },
    })

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
      title: makeDuplicateFormTitle(previewFormData.form.title, dashboardForms),
    })
  }, [
    reset,
    getValues,
    previewFormData,
    isPreviewFormLoading,
    isWorkspaceLoading,
    dashboardForms,
  ])

  const { handleSubmit } = formMethods

  const { createEmailModeFormMutation, createStorageModeFormMutation } =
    useCreateFormMutations()

  const handleCreateStorageModeForm = handleSubmit(
    ({ title, responseMode }) => {
      if (responseMode !== FormResponseMode.Encrypt) return

      return createStorageModeFormMutation.mutate({
        title,
        responseMode,
        publicKey: keypair.publicKey,
      })
    },
  )

  const handleDetailsSubmit = handleSubmit((inputs) => {
    if (inputs.responseMode === FormResponseMode.Email) {
      return createEmailModeFormMutation.mutate({
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
      createEmailModeFormMutation.isLoading ||
      createStorageModeFormMutation.isLoading,
    keypair,
    currentStep,
    direction,
    formMethods,
    handleDetailsSubmit,
    handleCreateStorageModeForm,
    handleBackToDetails,
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
