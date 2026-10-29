import { useMemo } from 'react'
import { Box } from '@chakra-ui/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
  FormStatus,
} from 'formsg-shared/types/form'
import { isLoginIdentityField } from 'formsg-shared/utils/login-identity'
import {
  getStepFields,
  getStepFieldsNeedingLogin,
} from 'formsg-shared/utils/step-login'

import InlineMessage from '~components/InlineMessage'

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
  const hasLoginFields = containsMyInfoFields || containsLoginIdentityFields
  // Closed forms may keep incomplete authentication fields while configuring
  // their provider. Publishing validates them; public forms remain locked.
  const unresolvedFlatFields = !showStepAccordion
    ? getStepFieldsNeedingLogin(stepOneFields, settings.authType)
    : []

  // Step 1's login and restrictions, saved to the form-level settings.
  const stepOneSettings = (
    <>
      <FormSingpassAuthToggle settings={settings} isDisabled={isFormPublic} />
      {settings.authType !== FormAuthType.NIL ? (
        <AuthSettingsSingpassSection
          settings={settings}
          isFormPublic={isFormPublic}
          nextQuestionNumber={getNextQuestionNumber(form?.form_fields ?? [])}
          hasLoginFields={isFormPublic && hasLoginFields}
          hasIdentityFields={containsLoginIdentityFields}
        />
      ) : null}
    </>
  )

  return (
    <Box>
      <AuthSettingsDisabledExplanationText
        isFormPublic={isFormPublic}
        containsMyInfoFields={
          !showStepAccordion && isFormPublic && containsMyInfoFields
        }
        containsLoginIdentityFields={
          !showStepAccordion && isFormPublic && containsLoginIdentityFields
        }
        isSubmitterIdCollectionEnabled={settings.isSubmitterIdCollectionEnabled}
        // Once later steps can log in, the first-step-only notice is false.
        isMrfFirstStepOnly={isMrf && !isStepLoginFlagOn}
      />
      {!showStepAccordion ? <AuthSettingsDescriptionText /> : null}
      {!isFormPublic && unresolvedFlatFields.length > 0 ? (
        <InlineMessage mb="1.5rem">
          These fields need matching authentication before you can publish:{' '}
          {unresolvedFlatFields.map((field) => field.title).join(', ')}. Choose
          the matching provider or delete the unused fields.
        </InlineMessage>
      ) : null}
      {showStepAccordion && form ? (
        <StepLoginAccordion form={form} settings={settings} />
      ) : (
        stepOneSettings
      )}
    </Box>
  )
}
