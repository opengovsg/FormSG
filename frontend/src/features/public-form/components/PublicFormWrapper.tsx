import { useMemo } from 'react'
import { Flex, Spacer } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'

import { usePublicFormContext } from '../PublicFormContext'

import SectionSidebar from './SectionSidebar'

export interface BgColorProps {
  colorTheme?: FormColorTheme | undefined
  isFooter?: boolean
}

export const useBgColor = ({ colorTheme, isFooter }: BgColorProps) =>
  useMemo(() => {
    if (isFooter) {
      return 'transparent'
    }
    if (!colorTheme) return 'neutral.100'
    return `theme-${colorTheme}.100`
  }, [colorTheme, isFooter])

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
  const { form, isAuthRequired } = usePublicFormContext()

  const bgColour = useBgColor({
    colorTheme: form?.startPage.colorTheme,
  })

  return (
    <Flex bg={bgColour} p={{ base: 0, md: '1.5rem' }} flex={1} justify="center">
      {isAuthRequired ? null : <SectionSidebar />}
      <Flex flexDir="column" maxW="57rem" w="100%">
        {children}
      </Flex>
      {isAuthRequired ? null : <Spacer />}
    </Flex>
  )
}
