import { useCallback, useMemo } from 'react'
import { Box, Flex, Spacer } from '@chakra-ui/react'

import { FormAuthType, FormColorTheme } from '~shared/types/form/form'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { FormAuth } from '../FormAuth'

import { FormFields } from './FormFields'
import { FormFieldsSkeleton } from './FormFieldsSkeleton'
import { FormSectionsProvider } from './FormSectionsContext'
import { SectionSidebar } from './SectionSidebar'

export const FormFieldsContainer = (): JSX.Element => {
  const { form, spcpSession, isLoading } = usePublicFormContext()

  const onSubmit = useCallback((values: Record<string, string>) => {
    console.log(values)
  }, [])

  const bgColour = useMemo(() => {
    if (isLoading) return 'neutral.100'
    if (!form) return ''
    const { colorTheme } = form.startPage
    switch (colorTheme) {
      case FormColorTheme.Blue:
        return 'secondary.100'
      default:
        return `theme-${colorTheme}.100`
    }
  }, [form, isLoading])

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
        colorTheme={form.startPage.colorTheme}
        onSubmit={onSubmit}
      />
    )
  }, [form, isAuthRequired, isLoading, onSubmit])

  return (
    <FormSectionsProvider form={form}>
      <Flex bg={bgColour} flex={1} justify="center" p="1.5rem">
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
