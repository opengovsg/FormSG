import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from 'formsg-shared/types/form'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'
import { getStepFields } from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useIsMrfStepLoginEnabled } from '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled'
import { isLaterStepLoginAvailable } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'
import { getNextQuestionNumber } from '~features/form/utils'
import { isMyInfo } from '~features/myinfo/utils'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'
import { AuthSettingsDisabledExplanationText } from './AuthSettingsDisabledExplanationText'
import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'
import { FormSingpassAuthToggle } from './FormSingpassAuthToggle'
import { StepLoginAccordion } from './StepLoginAccordion'

interface AuthSettingsSectionProps {
  settings: FormSettings
}

export const AuthSettingsSection = ({
  settings,
}: AuthSettingsSectionProps): JSX.Element => {
  const { data: form } = useAdminForm()
  const isStepLoginFlagOn = useIsMrfStepLoginEnabled()

  const isFormPublic = settings.status === FormStatus.Public
  const isMrf = form?.responseMode === FormResponseMode.Multirespondent
  // Every step gets its own section once later steps can carry a login and
  // the first step exists. Until then the page stays flat, as today.
  const showStepAccordion =
    !!form &&
    form.responseMode === FormResponseMode.Multirespondent &&
    form.workflow.length > 0 &&
    isLaterStepLoginAvailable(form, isStepLoginFlagOn)

  // With a section per step, only Step 1's own fields depend on its login.
  const stepOneFields = useMemo(
    () =>
      form && showStepAccordion
        ? getStepFields(form.form_fields, form.workflow, 0)
        : (form?.form_fields ?? []),
    [form, showStepAccordion],
  )
  const containsMyInfoFields = stepOneFields.some(isMyInfo)
  const containsLoginIdentityFields = stepOneFields.some(isLoginIdentityField)
  // Both kinds of fields depend on the current login, so lock it while they exist.
  const hasLoginFields = containsMyInfoFields || containsLoginIdentityFields

  // Step 1's login and restrictions, saved to the form-level settings.
  const stepOneSettings = (
    <>
      <FormSingpassAuthToggle
        settings={settings}
        isDisabled={isFormPublic || hasLoginFields}
      />
      {settings.authType !== FormAuthType.NIL ? (
        <AuthSettingsSingpassSection
          settings={settings}
          isFormPublic={isFormPublic}
          nextQuestionNumber={getNextQuestionNumber(form?.form_fields ?? [])}
          hasLoginFields={hasLoginFields}
          hasIdentityFields={containsLoginIdentityFields}
        />
      ) : null}
    </>
  )

  return (
    <Box>
      <AuthSettingsDisabledExplanationText
        isFormPublic={isFormPublic}
        containsMyInfoFields={!showStepAccordion && containsMyInfoFields}
        containsLoginIdentityFields={
          !showStepAccordion && containsLoginIdentityFields
        }
        isSubmitterIdCollectionEnabled={settings.isSubmitterIdCollectionEnabled}
        // Once later steps can log in, the first-step-only notice is false.
        isMrfFirstStepOnly={isMrf && !isStepLoginFlagOn}
      />
      {!showStepAccordion ? <AuthSettingsDescriptionText /> : null}
      {showStepAccordion && form ? (
        <StepLoginAccordion form={form} settings={settings} />
      ) : (
        stepOneSettings
      )}
    </Box>
  )
}
