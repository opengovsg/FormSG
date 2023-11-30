import { useMemo, useState } from 'react'
import { Box } from '@chakra-ui/react'

import { FormAuthType, FormResponseMode } from '~shared/types'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'
import { useDecryptedSubmission } from '~features/public-form/PublicFormEditPage/queries'
import { SecretKeyVerification } from '~features/public-form/PublicFormEditPage/SecretKeyVerification'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'

export const FormFieldsContainer = (): JSX.Element | null => {
  const {
    form,
    submissionId,
    isAuthRequired,
    isLoading: isFormLoading,
    handleSubmitForm,
    submissionData,
  } = usePublicFormContext()

  const [secretKey, setSecretKey] = useState<string>()

  const publicKey = useMemo(() => {
    if (!form || form.responseMode === FormResponseMode.Email) return null
    return form.publicKey
  }, [form])

  const { data, isLoading: isSubmissionLoading } =
    useDecryptedSubmission(secretKey)

  const isLoading = isFormLoading || isSubmissionLoading

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
    if (submissionId && !secretKey) {
      return (
        <SecretKeyVerification
          publicKey={publicKey}
          setSecretKey={setSecretKey}
          isLoading={isLoading}
        />
      )
    }

    return (
      <FormFields
        previousResponses={data?.responses}
        responseMode={form.responseMode}
        formFields={form.form_fields}
        formLogics={form.form_logics}
        colorTheme={form.startPage.colorTheme}
        onSubmit={handleSubmitForm}
      />
    )
  }, [
    data?.responses,
    form,
    handleSubmitForm,
    isAuthRequired,
    isLoading,
    publicKey,
    secretKey,
    submissionId,
  ])

  if (submissionData) return null

  return (
    <Box w="100%" minW={0} h="fit-content" maxW="57rem">
      {renderFields}
    </Box>
  )
}
