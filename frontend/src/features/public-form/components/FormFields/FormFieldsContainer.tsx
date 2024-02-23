import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box } from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from '~shared/types'

import { isKeypairValid } from '~utils/secretKeyValidation'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { decryptSubmission } from '~features/public-form/utils/decryptSubmission'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'
import { SecretKeyVerification } from './SecretKeyVerification'

export const FormFieldsContainer = (): JSX.Element | null => {
  const {
    form,
    previousSubmissionId,
    isAuthRequired,
    isLoading,
    handleSubmitForm,
    submissionData,
    encryptedPreviousSubmission,
  } = usePublicFormContext()

  const [previousSubmission, setPreviousSubmission] =
    useState<ReturnType<typeof decryptSubmission>>()

  const { submissionPublicKey = null, workflowStep } =
    encryptedPreviousSubmission ?? {}
  const [searchParams] = useSearchParams()
  const queryParams = Object.fromEntries([...searchParams])

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

    // MRF
    if (previousSubmissionId && !previousSubmission) {
      let submissionSecretKey = ''
      try {
        submissionSecretKey = queryParams.key
          ? decodeURIComponent(queryParams.key || '')
          : ''
      } catch (e) {
        console.log(e)
      }

      const isValid = isKeypairValid(
        submissionPublicKey || '',
        submissionSecretKey,
      )

      if (isValid) {
        setPreviousSubmission(
          decryptSubmission({
            submission: encryptedPreviousSubmission,
            secretKey: submissionSecretKey,
          }),
        )
      }

      return (
        <SecretKeyVerification
          publicKey={submissionPublicKey}
          setSecretKey={(secretKey) =>
            setPreviousSubmission(
              decryptSubmission({
                submission: encryptedPreviousSubmission,
                secretKey,
              }),
            )
          }
          isLoading={isLoading}
          prefillSecretKey={submissionSecretKey}
        />
      )
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
    previousSubmissionId,
    previousSubmission,
    workflowStep,
    handleSubmitForm,
    submissionPublicKey,
    queryParams.key,
    encryptedPreviousSubmission,
  ])

  if (submissionData) return null

  return (
    <Box w="100%" minW={0} h="fit-content" maxW="57rem">
      {renderFields}
    </Box>
  )
}
