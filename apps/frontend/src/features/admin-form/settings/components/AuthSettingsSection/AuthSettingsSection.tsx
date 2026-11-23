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
import { useUsesStepLoginRules } from '~features/admin-form/create/workflow/hooks/useUsesStepLoginRules'
import { isLaterStepLoginAvailable } from '~features/admin-form/create/workflow/utils/stepLoginAvailability'
import { getNextQuestionNumber } from '~features/form/utils'
import { isMyInfo } from '~features/myinfo/utils'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'
import { AuthSettingsDisabledExplanationText } from './AuthSettingsDisabledExplanationText'
import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'
import { FormSingpassAuthToggle } from './FormSingpassAuthToggle'
import { StepLoginCards } from './StepLoginCards'

interface AuthSettingsSectionProps {
  settings: FormSettings
}

export const AuthSettingsSection = ({
  settings,
}: AuthSettingsSectionProps): JSX.Element => {
  const { data: form } = useAdminForm()
  const isStepLoginFlagOn = useIsMrfStepLoginEnabled()
  const usesStepLoginRules = useUsesStepLoginRules()

  const isFormPublic = settings.status === FormStatus.Public
  const isMrf = form?.responseMode === FormResponseMode.Multirespondent
  // Every step gets its own section once later steps can carry a login and
  // the first step exists. Until then the page stays flat, as today.
  const showStepCards =
    !!form &&
    form.responseMode === FormResponseMode.Multirespondent &&
    form.workflow.length > 0 &&
    isLaterStepLoginAvailable(form, isStepLoginFlagOn)

  // With a section per step, only Step 1's own fields depend on its login.
  const stepOneFields = useMemo(
    () =>
      form && showStepCards
        ? getStepFields(form.form_fields, form.workflow, 0)
        : (form?.form_fields ?? []),
    [form, showStepCards],
  )
  const containsMyInfoFields = stepOneFields.some(isMyInfo)
  const containsLoginIdentityFields = stepOneFields.some(isLoginIdentityField)
  // Login fields lock Step 1's login, as the server refuses to leave them
  // without a login that fills them. In the editor, switching a step's login
  // offers to unassign them instead.
  const hasLoginFields = containsMyInfoFields || containsLoginIdentityFields
  // The per-step sections explain each step's own lock.
  const explainsLoginFields = !showStepCards

  // Step 1's login and restrictions, saved to the form-level settings.
  const stepOneSettings = (
    <>
      {usesStepLoginRules ? null : (
        <FormSingpassAuthToggle
          settings={settings}
          isDisabled={isFormPublic || hasLoginFields}
        />
      )}
      {usesStepLoginRules || settings.authType !== FormAuthType.NIL ? (
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
        containsMyInfoFields={explainsLoginFields && containsMyInfoFields}
        containsLoginIdentityFields={
          explainsLoginFields && containsLoginIdentityFields
        }
        isSubmitterIdCollectionEnabled={settings.isSubmitterIdCollectionEnabled}
        // Once later steps can log in, the first-step-only notice is false.
        // Until the legacy NRIC setting is converted, they still can't.
        isMrfFirstStepOnly={
          isMrf && !isLaterStepLoginAvailable(form, isStepLoginFlagOn)
        }
      />
      {!showStepCards ? <AuthSettingsDescriptionText /> : null}
      {showStepCards &&
      form &&
      settings.responseMode === FormResponseMode.Multirespondent ? (
        <StepLoginCards form={form} settings={settings} />
      ) : (
        stepOneSettings
      )}
    </Box>
  )
}
