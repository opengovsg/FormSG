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
  useMemo(
    () =>
      colorTheme
        ? `theme-${colorTheme}.100`
        : isFooter
        ? 'primary.100'
        : 'neutral.100',
    [colorTheme, isFooter],
  )

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
  const REMOVE_RESPONDENTS_INFOBOX_THRESHOLD = 10
  const { form, isLoading, isAuthRequired } = usePublicFormContext()
  const { data: { respondentRolloutEmail, respondentRolloutStorage } = {} } =
    useEnv()

  const bgColour = useBgColor({
    colorTheme: isLoading ? undefined : form?.startPage.colorTheme,
  })
  const isEmailForm = form?.responseMode === FormResponseMode.Email
  const switchEnvRolloutPercentage = isEmailForm
    ? respondentRolloutEmail
    : respondentRolloutStorage
  // Remove the switch env message if the React rollout for public form respondents is >10%
  const showSwitchEnvMessage = !!(
    switchEnvRolloutPercentage &&
    switchEnvRolloutPercentage <= REMOVE_RESPONDENTS_INFOBOX_THRESHOLD
  )
  return (
    <Flex bg={bgColour} p={{ base: 0, md: '1.5rem' }} flex={1} justify="center">
      {isAuthRequired ? null : <SectionSidebar />}
      <Flex flexDir="column">
        {/* TODO(#4279): Remove switch env message on full rollout */}
        {!isPreview && showSwitchEnvMessage && <PublicSwitchEnvMessage />}
        {children}
      </Flex>
      {isAuthRequired ? null : <Spacer />}
    </Flex>
  )
}
