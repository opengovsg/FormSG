import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

import {
  FormAuthType,
  FormSettings,
  FormStatus,
} from 'formsg-shared/types/form'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'

import { useAdminForm } from '~features/admin-form/common/queries'
import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'
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
  const containsLoginIdentityFields = useMemo(
    () => form?.form_fields.some(isLoginIdentityField) ?? false,
    [form?.form_fields],
  )
  // Both kinds of fields depend on the current login, so lock it while they exist.
  const hasLoginFields = containsMyInfoFields || containsLoginIdentityFields

  const isFormPublic = settings.status === FormStatus.Public

  return (
    <Box>
      <AuthSettingsDisabledExplanationText
        isFormPublic={isFormPublic}
        containsMyInfoFields={containsMyInfoFields}
        containsLoginIdentityFields={containsLoginIdentityFields}
        formResponseMode={form?.responseMode}
      />
      <AuthSettingsDescriptionText />
      <FormSingpassAuthToggle
        settings={settings!}
        isDisabled={isFormPublic || hasLoginFields}
      />
      {settings.authType !== FormAuthType.NIL ? (
        <AuthSettingsSingpassSection
          settings={settings}
          isFormPublic={isFormPublic}
          nextQuestionNumber={
            (form?.form_fields.filter(
              (field) => !NON_RESPONSE_FIELD_SET.has(field.fieldType),
            ).length ?? 0) + 1
          }
          hasLoginFields={hasLoginFields}
          hasIdentityFields={containsLoginIdentityFields}
        />
      ) : null}
    </Box>
  )
}
