import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from 'formsg-shared/types'
import { isSubmitterIdCollected } from 'formsg-shared/utils/login-identity'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'

export const FormFieldsContainer = (): JSX.Element | null => {
  const { t } = useTranslation()

  const {
    form,
    isAuthRequired,
    hasSingleSubmissionValidationError,
    hasRespondentNotWhitelistedError,
    isLoading,
    handleSubmitForm,
    submissionData,
    previousSubmission,
    previousAttachments,
    currentWorkflowStep,
    mrfStepAuthTarget,
  } = usePublicFormContext()

  const renderFields = useMemo(() => {
    if (isLoading) {
      return <FormFieldsSkeleton />
    }

    if (!form) {
      // TODO: Add/redirect to error page
      return (
        <div>
          {t('features.publicForm.components.formFieldsContainer.error')}
        </div>
      )
    }

    // A later MRF step only asks for login when it has its own; form.authType
    // is then that step's login, not Step 1's.
    if (
      isAuthRequired &&
      form.authType !== FormAuthType.NIL &&
      (form.responseMode !== FormResponseMode.Multirespondent ||
        !previousSubmission ||
        !!mrfStepAuthTarget)
    ) {
      return (
        <FormAuth
          authType={form.authType}
          isSubmitterIdCollectionEnabled={isSubmitterIdCollected(form)}
          hasSingleSubmissionValidationError={
            hasSingleSubmissionValidationError
          }
          hasRespondentNotWhitelistedError={hasRespondentNotWhitelistedError}
        />
      )
    }

    return (
      <FormFields
        previousAttachments={previousAttachments}
        formFields={form.form_fields}
        formLogics={form.form_logics}
        workflowStep={currentWorkflowStep}
        colorTheme={form.startPage.colorTheme}
        onSubmit={handleSubmitForm}
      />
    )
  }, [
    isLoading,
    form,
    isAuthRequired,
    previousSubmission,
    previousAttachments,
    currentWorkflowStep,
    mrfStepAuthTarget,
    handleSubmitForm,
    hasSingleSubmissionValidationError,
    hasRespondentNotWhitelistedError,
    t,
  ])

  if (submissionData) return null

  return (
    <Box w="100%" minW={0} h="fit-content" maxW="57rem">
      {renderFields}
    </Box>
  )
}
