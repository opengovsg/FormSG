import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

import { FormAuthType, FormSettings, FormStatus } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'
import { isMyInfo } from '~features/myinfo/utils'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'
import { AuthSettingsDisabledExplanationText } from './AuthSettingsDisabledExplanationText'
import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'
import { FormSingpassAuthToggle } from './FormSingpassAuthToggle'

interface AuthSettingsSectionProps {
  settings: FormSettings
}

export const AuthSettingsSection = ({
  settings,
}: AuthSettingsSectionProps): JSX.Element => {
  const { data: form } = useAdminForm()

  const containsMyInfoFields = useMemo(
    () => form?.form_fields.some(isMyInfo) ?? false,
    [form?.form_fields],
  )

  const isFormPublic = settings.status === FormStatus.Public

  return (
    <Box>
      <AuthSettingsDescriptionText />
      <AuthSettingsDisabledExplanationText
        isFormPublic={isFormPublic}
        containsMyInfoFields={containsMyInfoFields}
      />
      <FormSingpassAuthToggle
        settings={settings!}
        isDisabled={isFormPublic || containsMyInfoFields}
      />
      {settings.authType !== FormAuthType.NIL ? (
        <AuthSettingsSingpassSection
          settings={settings}
          isFormPublic={isFormPublic}
          containsMyInfoFields={containsMyInfoFields}
        />
      ) : null}
    </Box>
  )
}
