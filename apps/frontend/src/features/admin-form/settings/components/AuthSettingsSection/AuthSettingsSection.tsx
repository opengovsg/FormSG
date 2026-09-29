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

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'
import { AuthSettingsDisabledExplanationText } from './AuthSettingsDisabledExplanationText'
import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'
import { FormSingpassAuthToggle } from './FormSingpassAuthToggle'
import { MrfLoginOverview } from './MrfLoginOverview'

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

  // MRF forms set login per step in the Workflow tab; this page summarises it.
  const isStepLoginEnabled = useIsMrfSingpassAllSteps()
  const mrfForm =
    form?.responseMode === FormResponseMode.Multirespondent ? form : undefined
  if (isStepLoginEnabled && mrfForm) {
    return <MrfLoginOverview form={mrfForm} />
  }
  // Saved later-step logins stay visible while editing them is switched off.
  const hasLaterStepLogin = !!mrfForm?.workflow
    .slice(1)
    .some((step) => step.auth)

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
      {mrfForm && hasLaterStepLogin ? (
        <Box mt="2.5rem">
          <MrfLoginOverview form={mrfForm} isReadOnly />
        </Box>
      ) : null}
    </Box>
  )
}
