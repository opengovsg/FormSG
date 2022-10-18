import { useMemo } from 'react'
import { Flex, Spacer } from '@chakra-ui/react'

import { FormColorTheme, FormResponseMode } from '~shared/types'

import { useEnv } from '~features/env/queries'

import { usePublicFormContext } from '../PublicFormContext'

// TODO #4279: Remove after React rollout is complete
import { PublicSwitchEnvMessage } from './PublicSwitchEnvMessage'
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
  isPreview?: boolean
  children: React.ReactNode
}

/**
 * Wrapper for entire public form.
 * @precondition Must be nested inside a `PublicFormProvider`
 */
export const PublicFormWrapper = ({
  isPreview,
  children,
}: PublicFormWrapperProps): JSX.Element => {
  const { form, isAuthRequired } = usePublicFormContext()
  const {
    data: {
      respondentRolloutEmail,
      respondentRolloutStorage,
      removeRespondentsInfoboxThreshold,
    } = {},
  } = useEnv()

  const bgColour = useBgColor({
    colorTheme: form?.startPage.colorTheme,
  })
  const isEmailForm = form?.responseMode === FormResponseMode.Email
  const switchEnvRolloutPercentage = isEmailForm
    ? respondentRolloutEmail
    : respondentRolloutStorage

  // Remove the switch env message if the React rollout for public form respondents is => threshold
  const showSwitchEnvMessage = useMemo(
    () =>
      !!(
        switchEnvRolloutPercentage &&
        removeRespondentsInfoboxThreshold &&
        switchEnvRolloutPercentage < removeRespondentsInfoboxThreshold
      ),
    [switchEnvRolloutPercentage, removeRespondentsInfoboxThreshold],
  )
  return (
    <Flex bg={bgColour} p={{ base: 0, md: '1.5rem' }} flex={1} justify="center">
      {isAuthRequired ? null : <SectionSidebar />}
      <Flex flexDir="column" maxW="57rem" w="100%">
        {/* TODO(#4279): Remove switch env message on full rollout */}
        {!isPreview && showSwitchEnvMessage && <PublicSwitchEnvMessage />}
        {children}
      </Flex>
      {isAuthRequired ? null : <Spacer />}
    </Flex>
  )
}
