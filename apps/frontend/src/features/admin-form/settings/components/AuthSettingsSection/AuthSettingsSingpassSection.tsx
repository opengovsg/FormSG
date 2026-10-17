import { useTranslation } from 'react-i18next'
import { Divider, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import InlineMessage from '~components/InlineMessage'

import { FormSubmitterIdCollectionToggle } from './FormNricCollectionToggle'
import { FormSingleSubmissionToggle } from './FormSingleSubmissionToggle'
import { FormWhitelistAttachmentField } from './FormWhitelistAttachmentField'
import { MovedToFieldsMessage } from './MovedToFieldsMessage'
import { SingpassAuthOptionsRadio } from './SingpassAuthOptionsRadio'
import { SubmitterIdCollectionSetting } from './SubmitterIdCollectionSetting'

export interface AuthSettingsSingpassSectionProps {
  settings: FormSettings
  isFormPublic: boolean
  hasLoginFields: boolean
  hasIdentityFields: boolean
  nextQuestionNumber?: number
}

export const AuthSettingsSingpassSection = ({
  settings,
  isFormPublic,
  hasLoginFields,
  hasIdentityFields,
  nextQuestionNumber,
}: AuthSettingsSingpassSectionProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.settings.singpass.submitterIdCollection',
  })
  const isNricFieldEnabled = useFeatureIsOn(featureFlags.isNricFieldEnabled)
  const isSingpassSettingsDisabled = isFormPublic
  const isSinglepassAuthOptionsDisabled =
    isSingpassSettingsDisabled || hasLoginFields
  const isEncryptOrMultirespondentMode =
    settings.responseMode === FormResponseMode.Encrypt ||
    settings.responseMode === FormResponseMode.Multirespondent
  // Unconverted forms keep the legacy toggle until the flag enables identity
  // fields. If rollout is paused, the toggle stays locked while those fields exist.
  const usesIdentityFields =
    isEncryptOrMultirespondentMode &&
    !settings.isSubmitterIdCollectionEnabled &&
    isNricFieldEnabled
  const isToggleLockedByIdentityFields =
    !settings.isSubmitterIdCollectionEnabled && hasIdentityFields
  // Singpass-only login fills no identity fields, so there is nothing to point to.
  const offersIdentityFields =
    getLoginIdentityAttrsForAuthType(settings.authType).length > 0

  return (
    <>
      <SingpassAuthOptionsRadio
        settings={settings}
        isDisabled={isSinglepassAuthOptionsDisabled}
      />
      {!usesIdentityFields && (
        <>
          <Divider my="2.5rem" />
          {isNricFieldEnabled && isEncryptOrMultirespondentMode ? (
            <SubmitterIdCollectionSetting
              settings={settings}
              isFormPublic={isFormPublic}
              nextQuestionNumber={nextQuestionNumber}
            />
          ) : isToggleLockedByIdentityFields ? (
            <Stack spacing="1rem">
              <FormSubmitterIdCollectionToggle settings={settings} isDisabled />
              <InlineMessage>{t('removeIdentityFieldsFirst')}</InlineMessage>
            </Stack>
          ) : (
            <FormSubmitterIdCollectionToggle
              settings={settings}
              isDisabled={isFormPublic}
            />
          )}
        </>
      )}
      {usesIdentityFields && offersIdentityFields && (
        <>
          <Divider my="2.5rem" />
          <Stack spacing="1rem">
            <FormSubmitterIdCollectionToggle settings={settings} isDisabled />
            <MovedToFieldsMessage authType={settings.authType} />
          </Stack>
        </>
      )}
      <Divider my="2.5rem" />
      <FormSingleSubmissionToggle
        settings={settings}
        isDisabled={isSingpassSettingsDisabled}
      />
      {isEncryptOrMultirespondentMode ? (
        <>
          <Divider my="2.5rem" />
          <FormWhitelistAttachmentField
            settings={settings}
            isDisabled={isSingpassSettingsDisabled}
          />
        </>
      ) : null}
    </>
  )
}
