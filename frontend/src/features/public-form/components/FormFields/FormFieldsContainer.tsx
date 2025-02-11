import { useMemo } from 'react'
import { useLocalStorage } from 'react-use'
import { Box } from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from '~shared/types'

import { useToast } from '~hooks/useToast'
import { FormFieldValues } from '~templates/Field/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'

export const FormFieldsContainer = ({
  onCloseSaveDraft,
  isSaveDraftOpen,
}: {
  onCloseSaveDraft?: () => void
  isSaveDraftOpen?: boolean
}): JSX.Element | null => {
  const {
    form,
    isAuthRequired,
    hasSingleSubmissionValidationError,
    hasRespondentNotWhitelistedError,
    isLoading,
    handleSubmitForm,
    submissionData,
    encryptedPreviousSubmission,
    previousSubmission,
    previousAttachments,
  } = usePublicFormContext()

  const [localStorage, saveLocalStorage] =
    useLocalStorage<Record<string, FormFieldValues>>('formsg')
  const formId = form?._id.toString()
  const draftValues = localStorage && formId ? localStorage[formId] : undefined
  const toast = useToast()

  const saveDraftValues = useMemo(() => {
    return (values: FormFieldValues) => {
      if (!formId) return
      saveLocalStorage({
        ...localStorage,
        [formId]: values,
      })
      if (onCloseSaveDraft) {
        onCloseSaveDraft()
      }
      toast({ description: 'Your responses have been saved on your device.' })
    }
  }, [localStorage, saveLocalStorage, formId, toast, onCloseSaveDraft])

  const { workflowStep } = encryptedPreviousSubmission ?? {}

  const renderFields = useMemo(() => {
    // Render skeleton when no data
    if (isLoading) {
      return <FormFieldsSkeleton />
    }

    if (!form) {
      // TODO: Add/redirect to error page
      return <div>Something went wrong</div>
    }

    if (isAuthRequired && form.authType !== FormAuthType.NIL) {
      return (
        <FormAuth
          authType={form.authType}
          isSubmitterIdCollectionEnabled={form.isSubmitterIdCollectionEnabled}
          hasSingleSubmissionValidationError={
            hasSingleSubmissionValidationError
          }
          hasRespondentNotWhitelistedError={hasRespondentNotWhitelistedError}
        />
      )
    }

    return (
      <FormFields
        isSaveDraftOpen={isSaveDraftOpen}
        onCloseSaveDraft={onCloseSaveDraft}
        previousResponses={previousSubmission?.responses}
        previousAttachments={previousAttachments}
        formFields={form.form_fields}
        formLogics={form.form_logics}
        workflowStep={
          form.responseMode === FormResponseMode.Multirespondent
            ? form.workflow[
                // If no submission, then the workflowStep will be undefined.
                // Require explicit undefined check here since both 0 and undefined are falsy but mean different things here.
                workflowStep === undefined ? 0 : workflowStep + 1
              ]
            : undefined
        }
        colorTheme={form.startPage.colorTheme}
        onSubmit={handleSubmitForm}
        draftValues={draftValues}
        onSaveDraft={saveDraftValues}
      />
    )
  }, [
    isLoading,
    form,
    isAuthRequired,
    previousSubmission?.responses,
    previousAttachments,
    workflowStep,
    handleSubmitForm,
    hasSingleSubmissionValidationError,
    hasRespondentNotWhitelistedError,
    isSaveDraftOpen,
    onCloseSaveDraft,
    draftValues,
    saveDraftValues,
  ])

  if (submissionData) return null

  return (
    <Box w="100%" minW={0} h="fit-content" maxW="57rem">
      {renderFields}
    </Box>
  )
}
