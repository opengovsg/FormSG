import { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types/form'

import { usePublicFormContext } from '../PublicFormContext'

export interface PublicFormWrapperProps {
  children: React.ReactNode
}

/**
 * Wrapper for entire public form.
 * @precondition Must be nested inside a `PublicFormProvider`
 */
export const PublicFormWrapper = ({
  children,
}: PublicFormWrapperProps): JSX.Element => {
  const { form, isLoading } = usePublicFormContext()

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

  return (
    <Flex bg={bgColour} p="1.5rem" flex={1} justify="center">
      {children}
    </Flex>
  )
}
