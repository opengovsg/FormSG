import { useMemo } from 'react'
import { Box, Flex, Spacer } from '@chakra-ui/react'

import { FormAuthType } from '~shared/types/form/form'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'
import { FormSectionsProvider } from './FormSectionsContext'
import { SectionSidebar } from './SectionSidebar'

export const FormFieldsContainer = (): JSX.Element | null => {
  const {
    form,
    spcpSession,
    isLoading,
    handleSubmitForm,
    submissionData,
    formBgColor,
  } = usePublicFormContext()

  const isAuthRequired = useMemo(
    () => form && form.authType !== FormAuthType.NIL && !spcpSession,
    [form, spcpSession],
  )

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

  if (submissionData) {
    return null
  }

  return (
    <FormSectionsProvider form={form}>
      <Flex bg={formBgColor} flex={1} justify="center" p="1.5rem">
        {isAuthRequired ? null : <SectionSidebar />}
        <Box
          bg="white"
          p="2.5rem"
          w="100%"
          minW={0}
          h="fit-content"
          maxW="57rem"
        >
          {renderFields}
        </Box>
        {isAuthRequired ? null : <Spacer />}
      </Flex>
    </FormSectionsProvider>
  )
}
