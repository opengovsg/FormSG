import { useMemo } from 'react'
import { Box, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormSettings, FormStatus } from '~shared/types/form'

import Toggle from '~components/Toggle'

import { useAdminForm } from '~features/admin-form/common/queries'
import { isMyInfo } from '~features/myinfo/utils'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'
import { AuthSettingsDisabledExplanationText } from './AuthSettingsDisabledExplanationText'
import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'
import { FormSingpassAuthToggle } from './FormSingpassAuthToggle'

interface AuthSettingsSectionProps {
  settings: FormSettings
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
  const { data: form } = useAdminForm()

  const containsMyInfoFields = useMemo(
    () => form?.form_fields.some(isMyInfo) ?? false,
    [form?.form_fields],
  )

  const isFormPublic = useMemo(
    () => settings.status === FormStatus.Public,
    [settings],
  )

  const isDisabled = useMemo(
    () => isFormPublic || containsMyInfoFields,
    [isFormPublic, containsMyInfoFields],
  )

  return (
    <Box>
      <AuthSettingsDescriptionText />
      <AuthSettingsDisabledExplanationText
        isFormPublic={isFormPublic}
        containsMyInfoFields={containsMyInfoFields}
      />
      <Box style={{ opacity: isDisabled ? 0.3 : 1 }}>
        <FormSingpassAuthToggle settings={settings!} isDisabled={isDisabled} />
        {settings.authType !== FormAuthType.NIL ? (
          <AuthSettingsSingpassSection
            settings={settings}
            isDisabled={isDisabled}
          />
        ) : null}
      </Box>
    </Box>
  )
}
