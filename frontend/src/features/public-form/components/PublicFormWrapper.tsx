import { useMemo } from 'react'
import { Flex, Spacer } from '@chakra-ui/react'

import { usePublicFormContext } from '../PublicFormContext'

// TODO #4279: Remove after React rollout is complete
import { PublicSwitchEnvMessage } from './PublicSwitchEnvMessage'
import SectionSidebar from './SectionSidebar'

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
  const { form, isLoading, isAuthRequired } = usePublicFormContext()

  const bgColour = useMemo(() => {
    if (isLoading || !form) return 'neutral.100'
    return `theme-${form.startPage.colorTheme}.100`
  }, [form, isLoading])

  return (
    <Flex bg={bgColour} p={{ base: 0, md: '1.5rem' }} flex={1} justify="center">
      {isAuthRequired ? null : <SectionSidebar />}
      <Flex flexDir="column">
        <PublicSwitchEnvMessage />
        {children}
      </Flex>
      {isAuthRequired ? null : <Spacer />}
    </Flex>
  )
}
