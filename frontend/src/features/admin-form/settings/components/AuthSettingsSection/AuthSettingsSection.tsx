import { Box, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormSettings } from '~shared/types/form'

import Toggle from '~components/Toggle'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'
import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'
import { FormSingpassAuthToggle } from './FormSingpassAuthToggle'

interface AuthSettingsSectionProps {
  settings: FormSettings | undefined
}

export const AuthSettingsSectionSkeleton = (): JSX.Element => {
  return (
    <Skeleton>
      <AuthSettingsDescriptionText />
      <Toggle description="" label="" />
    </Skeleton>
  )
}

export const AuthSettingsSection = ({
  settings,
}: AuthSettingsSectionProps): JSX.Element => {
  return settings ? (
    <Box>
      <AuthSettingsDescriptionText />
      <FormSingpassAuthToggle settings={settings!} />
      {settings.authType !== FormAuthType.NIL ? (
        <AuthSettingsSingpassSection settings={settings} />
      ) : null}
    </Box>
  ) : (
    <AuthSettingsSectionSkeleton />
  )
}
