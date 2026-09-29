import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box } from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from 'formsg-shared/types/form'

import InlineMessage from '~components/InlineMessage'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useIsMrfSingpassAllSteps } from '~features/admin-form/create/workflow/hooks/useIsMrfSingpassAllSteps'
import { isMyInfo } from '~features/myinfo/utils'

import { MrfStepLoginSettings } from './StepLogin/MrfStepLoginSettings'
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

  // MRF forms edit login per step once the flag is on, or show saved later-step logins read-only.
  const isStepLoginEnabled = useIsMrfSingpassAllSteps()
  if (
    form?.responseMode === FormResponseMode.Multirespondent &&
    (isStepLoginEnabled || form.workflow.some((step) => !!step.auth))
  ) {
    return <MrfStepLoginSettings form={form} />
  }

  return (
    <Box>
      <AuthSettingsDisabledExplanationText
        isFormPublic={isFormPublic}
        containsMyInfoFields={containsMyInfoFields}
        formResponseMode={form?.responseMode}
      />
      <AuthSettingsDescriptionText />
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
