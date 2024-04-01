import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from '~shared/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'

export const FormFieldsContainer = (): JSX.Element | null => {
  const {
    form,
    isAuthRequired,
    isLoading,
    handleSubmitForm,
    submissionData,
    encryptedPreviousSubmission,
    previousSubmission,
  } = usePublicFormContext()

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

    // Redundant conditional for type narrowing
    if (isAuthRequired && form.authType !== FormAuthType.NIL) {
      return <FormAuth authType={form.authType} />
    }

    return (
      <FormFields
        previousResponses={previousSubmission?.responses}
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
      />
    )
  }, [
    isLoading,
    form,
    isAuthRequired,
    previousSubmission,
    workflowStep,
    handleSubmitForm,
  ])

  if (submissionData) return null

  return (
    <Box w="100%" minW={0} h="fit-content" maxW="57rem">
      {renderFields}
    </Box>
  )
}
