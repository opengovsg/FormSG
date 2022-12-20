import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

import { FormAuthType } from '~shared/types/form/form'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'

export const FormFieldsContainer = (): JSX.Element | null => {
  const { form, isAuthRequired, isLoading, handleSubmitForm, submissionData } =
    usePublicFormContext()

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
        formFields={form.form_fields}
        formLogics={form.form_logics}
        colorTheme={form.startPage.colorTheme}
        onSubmit={handleSubmitForm}
      />
    )
  }, [form, handleSubmitForm, isAuthRequired, isLoading])

  if (submissionData) return null

  return (
    <Box
      w="100%"
      minW={0}
      h="fit-content"
      maxW="57rem"
      sx={{
        '@media print': {
          display: 'block !important',
          overflow: 'visible !important',
        },
      }}
    >
      {renderFields}
    </Box>
  )
}
