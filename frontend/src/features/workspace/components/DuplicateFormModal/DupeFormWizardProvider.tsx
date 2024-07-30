import { useEffect } from 'react'

import { FormResponseMode } from '~shared/types'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useDuplicateFormMutations } from '~features/workspace/mutations'
import { useDashboard } from '~features/workspace/queries'
import { makeDuplicateFormTitle } from '~features/workspace/utils/createDuplicateFormTitle'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

import {
  CreateFormFlowStates,
  CreateFormWizardContext,
  CreateFormWizardContextReturn,
} from '../CreateFormModal/CreateFormWizardContext'
import { useCommonFormWizardProvider } from '../CreateFormModal/CreateFormWizardProvider'
import { useWorkspaceRowsContext } from '../WorkspaceFormRow/WorkspaceRowsContext'

export const useDupeFormWizardContext = (): CreateFormWizardContextReturn => {
  const { data: dashboardForms, isLoading: isWorkspaceLoading } = useDashboard()
  const { activeFormMeta } = useWorkspaceRowsContext()
  const { data: previewFormData, isLoading: isPreviewFormLoading } =
    usePreviewForm(
      activeFormMeta?._id ?? '',
      // Stop querying once submissionData is present.
      /* enabled= */ !!activeFormMeta,
    )

  const { formMethods, currentStep, direction, keypair, setCurrentStep } =
    useCommonFormWizardProvider()

  const { reset, getValues } = formMethods

  const isSingpass = !!previewFormData?.spcpSession

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

  const {
    dupeEmailModeFormMutation,
    dupeStorageModeFormMutation,
    dupeMultirespondentModeFormMutation,
  } = useDuplicateFormMutations()

  const { activeWorkspace, isDefaultWorkspace } = useWorkspaceContext()

  // do not mutate with workspaceId if it is 'All Forms' (default workspace)
  // as the default workspace contains an empty string as workspaceId
  const workspaceId = isDefaultWorkspace ? undefined : activeWorkspace._id

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode }) => {
      if (!activeFormMeta?._id) {
        return
      }

      switch (responseMode) {
        case FormResponseMode.Encrypt:
          return dupeStorageModeFormMutation.mutate({
            formIdToDuplicate: activeFormMeta._id,
            title,
            responseMode,
            publicKey: keypair.publicKey,
            workspaceId,
          })
        case FormResponseMode.Email:
          return
        case FormResponseMode.Multirespondent:
          return dupeMultirespondentModeFormMutation.mutate({
            formIdToDuplicate: activeFormMeta._id,
            title,
            responseMode,
            publicKey: keypair.publicKey,
            workspaceId,
          })
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = responseMode
          throw new Error('Invalid response mode')
        }
      }
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
        workspaceId,
      })
    }
    setCurrentStep([CreateFormFlowStates.Landing, 1])
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
    handleDetailsSubmit,
    handleCreateStorageModeOrMultirespondentForm,
    isSingpass,
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
