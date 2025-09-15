import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from '~shared/types/form'

import InlineMessage from '~components/InlineMessage'

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
  const { t } = useTranslation()
  const { data: form } = useAdminForm()

  const containsMyInfoFields = useMemo(
    () => form?.form_fields.some(isMyInfo) ?? false,
    [form?.form_fields],
  )

  const isFormPublic = settings.status === FormStatus.Public

  return (
    <Box>
      {form?.responseMode === FormResponseMode.Multirespondent ? (
        <InlineMessage variant="info" mt="0.5rem">
          {t('features.adminForm.settings.general.singpass.mrfFirstStep')}
        </InlineMessage>
      ) : null}
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
