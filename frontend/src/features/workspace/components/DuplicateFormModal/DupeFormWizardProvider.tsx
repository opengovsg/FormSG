import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { FormResponseMode, PublicFormViewDto } from '~shared/types'

import { usePreviewForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'
import {
  useDuplicateFormMutations,
  useEmailModeFeedbackMutation,
} from '~features/workspace/mutations'
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

export const useDupeFormWizardContext = (
  onClose: () => void,
): CreateFormWizardContextReturn => {
  const { t } = useTranslation()
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
  const hasMyInfoChildren = !!previewFormData?.form.form_fields.some(
    (field) => field.fieldType === 'children',
  )

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

  const { handleSubmit, setValue } = formMethods

  const {
    dupeEmailModeFormMutation,
    dupeStorageModeFormMutation,
    dupeMultirespondentModeFormMutation,
  } = useDuplicateFormMutations()

  const { user } = useUser()
  const adminEmail = user?.email

  const { emailModeFeedbackMutation } = useEmailModeFeedbackMutation()

  const { activeWorkspace, isDefaultWorkspace } = useWorkspaceContext()

  // do not mutate with workspaceId if it is 'All Forms' (default workspace)
  // as the default workspace contains an empty string as workspaceId
  const workspaceId = isDefaultWorkspace ? undefined : activeWorkspace._id

  const handleCreateStorageModeOrMultirespondentForm = handleSubmit(
    ({ title, responseMode, emails }) => {
      if (!activeFormMeta?._id) {
        return
      }

      switch (responseMode) {
        case FormResponseMode.Encrypt:
          return dupeStorageModeFormMutation.mutate(
            {
              formIdToDuplicate: activeFormMeta._id,
              title,
              responseMode,
              publicKey: keypair.publicKey,
              workspaceId,
              emails: emails.filter(Boolean),
            },
            {
              onSuccess: () => {
                setCurrentStep([CreateFormFlowStates.Landing, 1])
              },
            },
          )
        case FormResponseMode.Email:
          return
        case FormResponseMode.Multirespondent:
          return dupeMultirespondentModeFormMutation.mutate(
            {
              formIdToDuplicate: activeFormMeta._id,
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
      if (!activeFormMeta?._id) return

      return dupeEmailModeFormMutation.mutate({
        formIdToDuplicate: activeFormMeta._id,
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
  }
}

export const DupeFormWizardProvider = ({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}): JSX.Element => {
  const values = useDupeFormWizardContext(onClose)
  return (
    <CreateFormWizardContext.Provider value={values}>
      {children}
    </CreateFormWizardContext.Provider>
  )
}
